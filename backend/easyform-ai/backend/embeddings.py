"""Embeddings + vector index.

Primary: sentence-transformers (all-MiniLM-L6-v2) + FAISS inner-product index.
Fallback (no model / no internet / no faiss): scikit-learn TF-IDF cosine. The active backend is
reported in `EmbeddingBackend.name` and surfaced in the UI so nobody mistakes the fallback for
neural retrieval.
"""
from __future__ import annotations

import logging
import os
from typing import List, Tuple

import numpy as np

log = logging.getLogger(__name__)

EMBED_MODEL = os.getenv("EASYFORM_EMBED_MODEL", "sentence-transformers/all-MiniLM-L6-v2")
_MODEL_CACHE = {}


class EmbeddingBackend:
    def __init__(self):
        self.name = "tfidf"
        self.model = None
        self._tfidf = None
        if os.getenv("EASYFORM_DISABLE_ST", "0") != "1":
            try:
                from sentence_transformers import SentenceTransformer
                if EMBED_MODEL not in _MODEL_CACHE:
                    _MODEL_CACHE[EMBED_MODEL] = SentenceTransformer(EMBED_MODEL)
                self.model = _MODEL_CACHE[EMBED_MODEL]
                self.name = f"sentence-transformers:{EMBED_MODEL.split('/')[-1]}"
            except Exception as e:
                log.warning("sentence-transformers unavailable (%s); falling back to TF-IDF", e)

    def fit(self, texts: List[str]) -> np.ndarray:
        if self.model is not None:
            v = self.model.encode(texts, normalize_embeddings=True, batch_size=32, show_progress_bar=False)
            return np.asarray(v, dtype="float32")
        from sklearn.feature_extraction.text import TfidfVectorizer
        self._tfidf = TfidfVectorizer(ngram_range=(1, 2), sublinear_tf=True, min_df=1, stop_words="english")
        m = self._tfidf.fit_transform(texts)
        return np.asarray(m.todense(), dtype="float32")

    def encode(self, texts: List[str]) -> np.ndarray:
        if self.model is not None:
            v = self.model.encode(texts, normalize_embeddings=True, show_progress_bar=False)
            return np.asarray(v, dtype="float32")
        return np.asarray(self._tfidf.transform(texts).todense(), dtype="float32")


class VectorIndex:
    def __init__(self, vectors: np.ndarray):
        self.vectors = vectors
        self.faiss = None
        try:
            import faiss
            idx = faiss.IndexFlatIP(vectors.shape[1])
            idx.add(vectors)
            self.faiss = idx
            self.name = "faiss.IndexFlatIP"
        except Exception as e:
            log.info("faiss unavailable (%s); using numpy dot product", e)
            self.name = "numpy"

    def search(self, q: np.ndarray, k: int) -> Tuple[np.ndarray, np.ndarray]:
        k = min(k, self.vectors.shape[0])
        if self.faiss is not None:
            s, i = self.faiss.search(q, k)
            return s[0], i[0]
        s = self.vectors @ q[0]
        idx = np.argsort(-s)[:k]
        return s[idx], idx
