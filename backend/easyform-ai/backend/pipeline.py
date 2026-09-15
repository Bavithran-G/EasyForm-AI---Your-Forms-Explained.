"""Plain-Python orchestration of the whole flow. One `FormSession` per uploaded form."""
from __future__ import annotations

import hashlib
import logging
import statistics
import time
from typing import Dict, List, Optional

from backend.chunker import chunk_document
from backend.embeddings import EmbeddingBackend
from backend.explainer import Explainer
from backend.field_detector import detect_fields
from backend.ingestion import Document, IngestionError, ingest_pdf
from backend.reranker import Reranker
from backend.retriever import HybridRetriever, QueryPlan, build_query, tokenize
from backend.schemas import (Chunk, Evidence, ExplainResponse, Explanation, FollowupResponse, FormField,
                             PageInfo, VerificationReport)
from backend.verifier import Verifier, evidence_gate, relevance

log = logging.getLogger(__name__)

ABSTAIN_MSG = ("⚠️ I couldn't find enough information about this field in the uploaded government "
               "documents. I don't want to guess.")
ABSTAIN_MSG_FORM_ONLY = ("⚠️ I couldn't find enough information in the uploaded form to explain this field "
                         "confidently. Uploading the official instructions may help.")
FOLLOWUP_ABSTAIN = "I couldn't find guidance for that question in the uploaded documents."


class Models:
    """Expensive singletons shared by every session."""
    _embedder: Optional[EmbeddingBackend] = None
    _reranker: Optional[Reranker] = None
    _explainer: Optional[Explainer] = None

    @classmethod
    def embedder(cls) -> EmbeddingBackend:
        if cls._embedder is None:
            cls._embedder = EmbeddingBackend()
        return cls._embedder

    @classmethod
    def reranker(cls) -> Reranker:
        if cls._reranker is None:
            cls._reranker = Reranker()
        return cls._reranker

    @classmethod
    def explainer(cls) -> Explainer:
        if cls._explainer is None:
            cls._explainer = Explainer()
        return cls._explainer


def _is_label_only(e: Evidence, fld: FormField) -> bool:
    """A chunk that merely repeats the field's own label is not evidence about the field."""
    from rapidfuzz import fuzz
    t = e.text.replace("\n", " ").strip()
    if e.document_type != "form" or e.page != fld.page or len(t) > len(fld.text) + 60:
        return False
    return fuzz.partial_ratio(fld.text.lower(), t.lower()) >= 85 and len(t) <= 1.6 * len(fld.text) + 20


def _file_hash(path: str) -> str:
    h = hashlib.sha1()
    with open(path, "rb") as f:
        h.update(f.read())
    return h.hexdigest()[:12]


class FormSession:
    def __init__(self, form_path: str, form_name: str, instr_path: Optional[str] = None, instr_name: Optional[str] = None):
        t0 = time.time()
        self.form: Document = ingest_pdf(form_path, form_name, "form")
        self.instructions: Optional[Document] = None
        self.warnings: List[str] = []
        if instr_path:
            try:
                self.instructions = ingest_pdf(instr_path, instr_name or "instructions.pdf", "instructions")
            except IngestionError as e:
                self.warnings.append(f"Instructions PDF could not be processed ({e}); continuing in form-only mode.")
        self.fields: List[FormField] = detect_fields(self.form)
        if not self.fields:
            self.warnings.append("No form fields could be detected automatically in this PDF.")
        self.chunks: List[Chunk] = chunk_document(self.form)
        if self.instructions:
            self.chunks += chunk_document(self.instructions)
        # fresh embedder per session keeps TF-IDF fallback vocab per document set; ST model is cached globally
        self.embedder = EmbeddingBackend()
        self.retriever = HybridRetriever(self.chunks, embedder=self.embedder)
        self.reranker = Models.reranker()
        self.explainer = Models.explainer()
        self.verifier = Verifier(self.embedder)
        self.cache: Dict[str, ExplainResponse] = {}
        self.session_id = _file_hash(form_path) + ("-" + _file_hash(instr_path) if instr_path else "")
        self.build_ms = int((time.time() - t0) * 1000)

    # ---------------------------------------------------------------- info
    @property
    def mode(self) -> str:
        return "form_plus_instructions" if self.instructions else "form_only"

    def status(self) -> dict:
        return {
            "session_id": self.session_id,
            "mode": self.mode,
            "form": {"name": self.form.name, "pages": [p.model_dump() for p in self.form.pages],
                     "acroform": self.form.has_acroform, "chunks": sum(c.document_type == "form" for c in self.chunks),
                     "ocr_pages": [p.page for p in self.form.pages if p.ocr]},
            "instructions": ({"name": self.instructions.name, "pages": [p.model_dump() for p in self.instructions.pages],
                              "chunks": sum(c.document_type == "instructions" for c in self.chunks),
                              "ocr_pages": [p.page for p in self.instructions.pages if p.ocr]}
                             if self.instructions else None),
            "fields": [f.model_dump() for f in self.fields],
            "engine": {"retrieval": self.retriever.backend_name, "reranker": self.reranker.name,
                       "llm": self.explainer.model if self.explainer.available else None,
                       "llm_available": self.explainer.available, "build_ms": self.build_ms},
            "warnings": self.warnings,
        }

    def field(self, field_id: str) -> FormField:
        for f in self.fields:
            if f.field_id == field_id:
                return f
        raise KeyError(field_id)

    # ---------------------------------------------------------------- core
    def retrieve(self, fld: FormField, question: Optional[str] = None, top_n: int = 5):
        plan = build_query(fld, question)
        cands = [c for c in self.retriever.retrieve(plan) if not _is_label_only(c, fld)]
        if question:   # also search the question on its own so answers outside the field's section surface
            qplan = QueryPlan(text=question, field_ref=None, terms=tokenize(question), boost_ref=False)
            seen = {c.chunk_id for c in cands}
            cands += [c for c in self.retriever.retrieve(qplan, k=8) if c.chunk_id not in seen]
        evidence = self.reranker.rerank(plan.text, cands, top_n=top_n)
        core_terms = list(dict.fromkeys(t for t in plan.terms[: max(3, len(set(plan.terms)) // 3)]))
        ok, diag = evidence_gate(evidence, core_terms, plan.field_ref, self.reranker.model is not None,
                                 idf=self.retriever.bm25.idf)
        diag.update({"candidates": len(cands), "reranked": len(evidence), "query": plan.text,
                     "field_ref": plan.field_ref, "engine": self.retriever.backend_name, "reranker": self.reranker.name})
        return plan, evidence, ok, diag

    def _question_relevance(self, question: str, evidence: List[Evidence]) -> float:
        """IDF-weighted share of the question's words that occur in the evidence (BM25 idf)."""
        idf = self.retriever.bm25.idf
        pos = [v for v in idf.values() if v > 0]
        max_idf = statistics.median(pos) if pos else 1.0   # unknown words count as "typical", not dominant
        q = [t for t in dict.fromkeys(tokenize(question)) if len(t) > 2]
        if not q:
            return 1.0
        hay = set(tokenize(" ".join(f"{e.section} {e.subsection} {e.text}" for e in evidence)))
        w = {t: (idf.get(t, max_idf) if idf.get(t, 0) > 0 else max_idf) for t in q}
        return sum(w[t] for t in q if t in hay) / sum(w.values())

    def explain(self, field_id: str, baseline: bool = False, use_cache: bool = True) -> ExplainResponse:
        key = f"{field_id}:{'b' if baseline else 'o'}"
        if use_cache and key in self.cache:
            return self.cache[key]
        t0 = time.time()
        fld = self.field(field_id)
        plan, evidence, ok, diag = self.retrieve(fld)

        if baseline:
            exp, usage, mode = self.explainer.explain(fld, [], baseline=True)
            resp = ExplainResponse(field_id=field_id, original_field=fld.text, mode=self.mode, explanation=exp,
                                   evidence=[], verification=VerificationReport(notes=["baseline: no retrieval, no verification"]),
                                   query=fld.text, llm_used=(mode == "baseline"), llm_model=self.explainer.model,
                                   latency_ms=int((time.time() - t0) * 1000), tokens=usage or None,
                                   retrieval={"engine": "none (baseline)"})
            self.cache[key] = resp
            return resp

        if not ok:
            resp = ExplainResponse(field_id=field_id, original_field=fld.text, mode=self.mode,
                                   explanation=Explanation(simplified_label=fld.text, confidence="low", evidence_status="insufficient"),
                                   evidence=evidence, verification=VerificationReport(notes=["abstained before generation: " + diag["gate"]]),
                                   query=plan.text, llm_used=False, abstained=True,
                                   message=ABSTAIN_MSG_FORM_ONLY if self.mode == "form_only" else ABSTAIN_MSG,
                                   latency_ms=int((time.time() - t0) * 1000), retrieval=diag)
            self.cache[key] = resp
            return resp

        exp, usage, mode = self.explainer.explain(fld, evidence)
        exp, report = self.verifier.verify(exp, evidence) if mode == "llm" else (exp, VerificationReport(notes=[f"{mode}: verification skipped"]))
        abstained = exp.evidence_status == "insufficient"
        msg = ""
        if abstained:
            msg = ABSTAIN_MSG_FORM_ONLY if self.mode == "form_only" else ABSTAIN_MSG
        elif exp.evidence_status == "partial":
            msg = "Only part of this field is explained by the uploaded documents; unsupported statements were removed."
        resp = ExplainResponse(field_id=field_id, original_field=fld.text, mode=self.mode, explanation=exp,
                               evidence=evidence, verification=report, query=plan.text, llm_used=(mode == "llm"),
                               llm_model=self.explainer.model if mode == "llm" else None, abstained=abstained,
                               message=msg, latency_ms=int((time.time() - t0) * 1000), tokens=usage or None,
                               retrieval=diag)
        self.cache[key] = resp
        return resp

    def followup(self, field_id: str, question: str) -> FollowupResponse:
        t0 = time.time()
        fld = self.field(field_id)
        plan, evidence, ok, diag = self.retrieve(fld, question=question, top_n=5)
        q_rel = self._question_relevance(question, evidence)
        diag["question_relevance"] = round(q_rel, 2)
        min_rel = 0.6 if not self.explainer.available else 0.2
        if not evidence or q_rel < min_rel:
            return FollowupResponse(field_id=field_id, question=question, answer=FOLLOWUP_ABSTAIN, evidence=evidence,
                                    evidence_status="insufficient", confidence="low", llm_used=False, abstained=True,
                                    latency_ms=int((time.time() - t0) * 1000))
        data, usage, mode = self.explainer.followup(fld, question, evidence)
        answer = data.get("answer", "")
        status = data.get("evidence_status", "insufficient")
        conf = data.get("confidence", "low")
        if mode == "llm" and answer:
            tmp = Explanation(meaning=answer, evidence_status=status if status in ("supported", "partial", "insufficient") else "partial",
                              confidence=conf if conf in ("high", "medium", "low") else "medium")
            tmp, rep = self.verifier.verify(tmp, evidence)
            answer, status, conf = tmp.meaning, tmp.evidence_status, tmp.confidence
        abstained = status == "insufficient" or not answer.strip()
        if abstained:
            answer = FOLLOWUP_ABSTAIN
        return FollowupResponse(field_id=field_id, question=question, answer=answer, evidence=evidence,
                                evidence_status=status if status in ("supported", "partial", "insufficient") else "insufficient",
                                confidence=conf if conf in ("high", "medium", "low") else "low",
                                llm_used=(mode == "llm"), abstained=abstained, latency_ms=int((time.time() - t0) * 1000))

    def overview(self) -> List[dict]:
        """Whole-form view: cheap, retrieval-only summary per field (no LLM calls up front)."""
        out = []
        for f in self.fields:
            _, ev, ok, diag = self.retrieve(f, top_n=1)
            out.append({"field_id": f.field_id, "text": f.text, "page": f.page, "field_type": f.field_type,
                        "section": f.section, "has_evidence": ok,
                        "top_source": ({"document": ev[0].document_name, "page": ev[0].page,
                                        "section": " / ".join(x for x in (ev[0].section, ev[0].subsection) if x)} if ev else None)})
        return out
