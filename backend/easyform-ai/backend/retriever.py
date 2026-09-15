"""Hybrid retrieval over chunks from the form and (optionally) the instructions.

query rewrite  ->  BM25 top-K  +  vector top-K  ->  reciprocal-rank fusion
              ->  field-reference boost ("Line 3a" chunks for field "3a ...")  ->  dedupe
"""
from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import Dict, List, Optional

import numpy as np
from rank_bm25 import BM25Okapi

from backend.embeddings import EmbeddingBackend, VectorIndex
from backend.schemas import Chunk, Evidence, FormField

TOKEN_RE = re.compile(r"[a-z0-9]+(?:'[a-z]+)?")
STOP = set(("the a an and or of to in on for is are be if any this that with as by at from your you it its "
            "what i do does not have can which should how there my me would could will when where who why "
            "yes no these those than then also just").split())
ENUM_RE = re.compile(r"^(\d{1,2}[a-z]?|part\s+[ivx]+)\b[\.\):]?\s*", re.I)


def tokenize(text: str) -> List[str]:
    return [t for t in TOKEN_RE.findall(text.lower()) if t not in STOP]


@dataclass
class RetrievalConfig:
    bm25_k: int = 12
    vector_k: int = 12
    rrf_k: int = 60
    field_ref_boost: float = 0.6     # fraction of the top fused score added to field-matched chunks
    max_candidates: int = 16


@dataclass
class QueryPlan:
    text: str                         # dense-retrieval query
    field_ref: Optional[str]          # e.g. "line 3a", "part i"
    terms: List[str] = field(default_factory=list)   # weighted BM25 tokens
    boost_ref: bool = True            # follow-up questions should not be pinned to the field's section


def build_query(fld: FormField, question: Optional[str] = None) -> QueryPlan:
    label = fld.text.strip()
    m = ENUM_RE.match(label)
    ref = None
    core = label
    if m:
        core = label[m.end():]
        e = m.group(1).lower()
        ref = e if e.startswith("part") else f"line {e}"
    else:
        # fields inside a numbered group inherit the group's reference
        gm = re.match(r"Part of:\s*(\d{1,2}[a-z]?)\b", fld.context or "", re.I)
        if gm:
            ref = f"line {gm.group(1).lower()}"
        pm = re.match(r"(Part\s+[IVX]+)\b", fld.section or "", re.I)
        if pm and not ref:
            ref = pm.group(1).lower()
    parent = ""
    pm2 = re.match(r"Part of:\s*(.+?)\.\s", fld.context or "")
    if pm2:
        parent = pm2.group(1)
    parts = [core]
    if fld.field_type in ("checkbox", "checkbox_group"):
        parts.append("check the box")
    if ref:
        parts.append(ref)
    if parent:
        parts.append(parent[:160])
    if fld.section and not fld.section.lower().startswith("page "):
        parts.append(fld.section)
    if question:
        parts.insert(0, question)
    text = ". ".join(p for p in parts if p)
    # BM25 tokens: the field's own wording dominates; nearby context contributes a few terms only
    terms = tokenize(core) * 3 + tokenize(parent) * 2 + (tokenize(ref) if ref else []) + tokenize(fld.section or "")
    ctx_terms = [t for t in tokenize(fld.context or "") if t not in terms][:12]
    terms += ctx_terms
    if question:
        terms = tokenize(question) * 3 + terms
    return QueryPlan(text=text, field_ref=ref, terms=terms, boost_ref=question is None)


class HybridRetriever:
    def __init__(self, chunks: List[Chunk], embedder: Optional[EmbeddingBackend] = None, config: Optional[RetrievalConfig] = None):
        self.chunks = chunks
        self.config = config or RetrievalConfig()
        self.embedder = embedder or EmbeddingBackend()
        self.bm25 = BM25Okapi([tokenize(self._index_text(c)) for c in chunks])
        self.vectors = self.embedder.fit([self._index_text(c) for c in chunks])
        self.index = VectorIndex(self.vectors)
        self.backend_name = f"bm25 + {self.embedder.name} ({self.index.name})"

    @staticmethod
    def _index_text(c: Chunk) -> str:
        head = " ".join(x for x in (c.section, c.subsection) if x)
        return f"{head}. {c.text}" if head else c.text

    def retrieve(self, plan: QueryPlan, k: Optional[int] = None) -> List[Evidence]:
        cfg = self.config
        k = k or cfg.max_candidates
        q_tokens = plan.terms or tokenize(plan.text)
        bm = self.bm25.get_scores(q_tokens)
        bm_rank = {int(i): r for r, i in enumerate(np.argsort(-bm)[:cfg.bm25_k]) if bm[i] > 0}
        qv = self.embedder.encode([plan.text])
        vs, vi = self.index.search(qv, cfg.vector_k)
        vec_rank = {int(i): r for r, i in enumerate(vi) if i >= 0 and vs[r] > 0}

        fused: Dict[int, float] = {}
        for i, r in bm_rank.items():
            fused[i] = fused.get(i, 0) + 1.0 / (cfg.rrf_k + r)
        for i, r in vec_rank.items():
            fused[i] = fused.get(i, 0) + 1.0 / (cfg.rrf_k + r)
        if not fused:
            return []
        top = max(fused.values())
        if plan.field_ref and plan.boost_ref:
            ref = plan.field_ref.lower()
            for i in list(fused):
                c = self.chunks[i]
                hay = f"{c.field} {c.subsection} {c.section}".lower()
                if re.search(rf"\b{re.escape(ref)}\b", hay):
                    fused[i] += cfg.field_ref_boost * top
            # chunks directly about the field that neither retriever surfaced still deserve a look
            for i, c in enumerate(self.chunks):
                if i not in fused and c.field.lower() == ref:
                    fused[i] = 0.5 * top

        order = sorted(fused, key=lambda i: -fused[i])[:k]
        out, seen = [], set()
        for i in order:
            c = self.chunks[i]
            key = c.text[:120]
            if key in seen:
                continue
            seen.add(key)
            out.append(Evidence(chunk_id=c.chunk_id, document_name=c.document_name, document_type=c.document_type,
                                page=c.page, section=c.section, subsection=c.subsection, text=c.text,
                                score=float(fused[i]), bm25_rank=bm_rank.get(i), semantic_rank=vec_rank.get(i)))
        return out
