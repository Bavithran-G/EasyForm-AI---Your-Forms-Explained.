"""Verification and abstention.

1. `evidence_gate` decides BEFORE the LLM call whether retrieval found anything about the field
   (reranker score, lexical overlap with the field wording, or a direct field reference such as a
   "Line 3a" section). If not, the pipeline abstains.
2. `verify` checks each generated sentence against the evidence: content-word overlap, fuzzy
   partial match and (when available) embedding similarity. Sentences carrying specific tokens
   (numbers, %, $, form/section numbers, dates) must have those tokens in the evidence.
   Unsupported sentences are removed, confidence is downgraded, and evidence_status is set to the
   more conservative of the model's own claim and the check.
"""
from __future__ import annotations

import re
from typing import List, Optional, Tuple

from rapidfuzz import fuzz

from backend.retriever import tokenize
from backend.schemas import Evidence, Explanation, VerificationReport

SENT_RE = re.compile(r"(?<=[\.\?\!])\s+(?=[A-Z\"“\(])")
SPECIFIC_RE = re.compile(r"(\$\s?\d[\d,]*|\d+(?:\.\d+)?\s?%|\b\d{1,4}\b|\bForm\s+[\w-]+|\bsection\s+[\d\.\(\)\w-]+|\bPub\.?\s*\d+)", re.I)
GENERIC_SENTENCE_RE = re.compile(r"^(no official example|the (form|document|instructions?) (does|do) not|not specified|"
                                 r"the uploaded (form|documents?) (does|do) not|there is no|this field is|it is|"
                                 r"leave (it|this) blank if)", re.I)


def relevance(core_terms: List[str], e: Evidence) -> float:
    """Fraction of the field's own content words that appear in the evidence."""
    if not core_terms:
        return 0.0
    hay = set(tokenize(f"{e.section} {e.subsection} {e.text}"))
    core = set(core_terms)
    return len(core & hay) / len(core)


def weighted_relevance(core_terms: List[str], e: Evidence, idf: dict) -> float:
    """IDF-weighted share of the field's content words found in the evidence (rare words matter more)."""
    if not core_terms:
        return 0.0
    hay = set(tokenize(f"{e.section} {e.subsection} {e.text}"))
    mx = max(idf.values()) if idf else 1.0
    w = {t: (idf[t] if idf.get(t, 0) > 0 else mx) for t in set(core_terms)}
    return sum(w[t] for t in w if t in hay) / sum(w.values())


def evidence_gate(evidence: List[Evidence], core_terms: List[str], field_ref: Optional[str],
                  reranker_active: bool, idf: Optional[dict] = None, min_ce: float = 0.2,
                  min_rel: float = 0.55) -> Tuple[bool, dict]:
    if not evidence:
        return False, {"reason": "no candidates", "gate": "abstain"}
    top = evidence[0]
    rel = max((weighted_relevance(core_terms, e, idf) if idf else relevance(core_terms, e)) for e in evidence[:3])
    ref_hit = bool(field_ref) and any(
        re.search(rf"\b{re.escape(field_ref)}\b", f"{e.field if hasattr(e, 'field') else ''} {e.subsection} {e.section}".lower())
        for e in evidence[:3])
    ok = ref_hit or rel >= min_rel or (reranker_active and top.score >= min_ce)
    return ok, {"top_score": round(top.score, 3), "lexical_relevance": round(rel, 2), "field_ref_hit": ref_hit,
                "gate": "pass" if ok else "abstain"}


class Verifier:
    def __init__(self, embedder=None):
        self.embedder = embedder if (embedder is not None and getattr(embedder, "model", None) is not None) else None

    def _support(self, sentence: str, evidence: List[Evidence]) -> float:
        toks = set(tokenize(sentence))
        if not toks:
            return 1.0
        best = 0.0
        for e in evidence:
            hay = f"{e.section} {e.subsection} {e.text}"
            htoks = set(tokenize(hay))
            overlap = len(toks & htoks) / len(toks)
            fz = fuzz.partial_ratio(sentence.lower(), hay.lower()) / 100.0
            best = max(best, overlap, fz * 0.9)
        if best < 0.6 and self.embedder is not None:
            try:
                import numpy as np
                v = self.embedder.encode([sentence] + [e.text for e in evidence])
                sims = (v[1:] @ v[0])
                best = max(best, float(np.max(sims)))
            except Exception:
                pass
        return best

    @staticmethod
    def _specific_ok(sentence: str, evidence: List[Evidence]) -> Tuple[bool, List[str]]:
        hay = " ".join(f"{e.section} {e.subsection} {e.text}" for e in evidence).lower()
        hay_norm = re.sub(r"[\s,]", "", hay)
        missing = []
        for m in SPECIFIC_RE.findall(sentence):
            tok = re.sub(r"[\s,]", "", m.lower())
            if tok not in hay_norm:
                missing.append(m)
        return not missing, missing

    def verify(self, exp: Explanation, evidence: List[Evidence], threshold: float = 0.55) -> Tuple[Explanation, VerificationReport]:
        rep = VerificationReport()
        if not evidence:
            rep.notes.append("no evidence")
            exp.evidence_status, exp.confidence = "insufficient", "low"
            return exp, rep
        for key in ("meaning", "what_to_enter", "format", "example", "note"):
            text = getattr(exp, key) or ""
            if not text.strip():
                continue
            kept = []
            for s in SENT_RE.split(text.strip()):
                s = s.strip()
                if not s:
                    continue
                if GENERIC_SENTENCE_RE.match(s) and not SPECIFIC_RE.search(s):
                    kept.append(s)          # meta/hedging statements carry no government claim
                    continue
                rep.checked_sentences += 1
                ok_spec, missing = self._specific_ok(s, evidence)
                score = self._support(s, evidence)
                if ok_spec and score >= threshold:
                    rep.supported_sentences += 1
                    kept.append(s)
                else:
                    why = f"unsupported specifics {missing}" if not ok_spec else f"support {score:.2f} < {threshold}"
                    rep.unsupported.append(f"[{key}] {s} ({why})")
                    rep.removed.append(s)
            setattr(exp, key, " ".join(kept))
        if exp.example and re.search(r"\d{3,}", exp.example) and not self._specific_ok(exp.example, evidence)[0]:
            rep.removed.append(exp.example); exp.example = ""
        ratio = rep.supported_sentences / rep.checked_sentences if rep.checked_sentences else 0.0
        rank = {"supported": 2, "partial": 1, "insufficient": 0}
        if not (exp.meaning.strip() or exp.what_to_enter.strip()):
            status = "insufficient"
        elif rep.removed or ratio < 0.8:
            status = "partial"
        else:
            status = "supported"
        final = min(status, exp.evidence_status, key=lambda s: rank[s])
        if rank[final] < rank[exp.evidence_status] or rep.removed:
            rep.downgraded = True
        exp.evidence_status = final
        conf = {"supported": "high", "partial": "medium", "insufficient": "low"}[final]
        crank = {"high": 2, "medium": 1, "low": 0}
        exp.confidence = min(conf, exp.confidence, key=lambda c: crank[c])
        if evidence and evidence[0].score < 0.35 and exp.confidence == "high":
            exp.confidence = "medium"; rep.notes.append("top evidence score is weak")
        return exp, rep
