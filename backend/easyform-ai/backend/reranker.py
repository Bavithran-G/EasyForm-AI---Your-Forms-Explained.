"""CrossEncoder reranking with graceful fallback.

If the cross-encoder cannot be loaded (no internet, no torch, low memory) we keep the hybrid
fused order and say so (`Reranker.name == "fallback:hybrid-fusion"`). Scores are made comparable
by mapping them to [0, 1] so the verifier/abstention thresholds can use them either way.
"""
from __future__ import annotations

import logging
import math
import os
from typing import List

from backend.schemas import Evidence

log = logging.getLogger(__name__)
RERANK_MODEL = os.getenv("EASYFORM_RERANK_MODEL", "cross-encoder/ms-marco-MiniLM-L-6-v2")
_CACHE = {}


class Reranker:
    def __init__(self):
        self.model = None
        self.name = "fallback:hybrid-fusion"
        if os.getenv("EASYFORM_DISABLE_RERANK", "0") == "1":
            return
        try:
            from sentence_transformers import CrossEncoder
            if RERANK_MODEL not in _CACHE:
                _CACHE[RERANK_MODEL] = CrossEncoder(RERANK_MODEL, max_length=512)
            self.model = _CACHE[RERANK_MODEL]
            self.name = f"cross-encoder:{RERANK_MODEL.split('/')[-1]}"
        except Exception as e:
            log.warning("CrossEncoder unavailable (%s); using hybrid fusion order", e)

    def rerank(self, query: str, cands: List[Evidence], top_n: int = 5) -> List[Evidence]:
        if not cands:
            return []
        if self.model is not None:
            try:
                pairs = [(query, f"{c.section} {c.subsection}. {c.text}") for c in cands]
                raw = self.model.predict(pairs)
                for c, s in zip(cands, raw):
                    c.score = 1.0 / (1.0 + math.exp(-float(s)))     # sigmoid of the CE logit
                cands = sorted(cands, key=lambda c: -c.score)
                return cands[:top_n]
            except Exception as e:
                log.warning("Reranking failed (%s); using hybrid order", e)
        # fallback: normalise fused RRF scores to [0, 1] relative to the best candidate
        top = max(c.score for c in cands) or 1.0
        for c in cands:
            c.score = round(c.score / top, 4)
        return sorted(cands, key=lambda c: -c.score)[:top_n]
