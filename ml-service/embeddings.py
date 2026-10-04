"""Sentence embeddings for similarity search and clustering.

Primary: sentence-transformers all-MiniLM-L6-v2 (384-dim vectors that capture
meaning, so "motor overheating" is close to "drive running hot").
The model downloads once (~90 MB) to the Hugging Face cache, then works offline.

Fallback: TF-IDF + truncated SVD ("LSA"), so the demo still runs if the model
can't be downloaded. Vectors are L2-normalised either way, so cosine
similarity is just a dot product.
"""
import numpy as np
from scipy import sparse
from sklearn.base import BaseEstimator, TransformerMixin

from config import EMBEDDING_MODEL


class Embedder:
    def __init__(self):
        self.kind = "sentence-transformers"
        self._model = None
        self._lsa = None
        try:
            from sentence_transformers import SentenceTransformer

            self._model = SentenceTransformer(EMBEDDING_MODEL, device="cpu")
        except Exception as exc:  # no internet on first run, missing torch, ...
            print(f"[embeddings] {EMBEDDING_MODEL} unavailable ({exc}); using TF-IDF/LSA fallback")
            self.kind = "tfidf-lsa"

    def fit(self, texts: list[str]) -> "Embedder":
        """Only needed for the fallback (sentence-transformers is pre-trained)."""
        if self._model is None:
            from sklearn.decomposition import TruncatedSVD
            from sklearn.feature_extraction.text import TfidfVectorizer
            from sklearn.pipeline import make_pipeline

            self._lsa = make_pipeline(
                TfidfVectorizer(ngram_range=(1, 2), sublinear_tf=True),
                TruncatedSVD(n_components=128, random_state=42),
            ).fit(texts)
        return self

    def encode(self, texts: list[str]) -> np.ndarray:
        if self._model is not None:
            vecs = self._model.encode(texts, batch_size=64, show_progress_bar=False)
        else:
            vecs = self._lsa.transform(texts)
        vecs = np.asarray(vecs, dtype=np.float32)
        norms = np.linalg.norm(vecs, axis=1, keepdims=True)
        return vecs / np.clip(norms, 1e-12, None)

    # joblib doesn't need the torch model inside the pickle, so persist only what's needed.
    def __getstate__(self):
        return {"kind": self.kind, "_lsa": self._lsa}

    def __setstate__(self, state):
        self.__dict__.update(state)
        self._model = None
        if self.kind == "sentence-transformers":
            from sentence_transformers import SentenceTransformer

            self._model = SentenceTransformer(EMBEDDING_MODEL, device="cpu")


# One embedder per process, shared by the classifiers and the similarity search
# (so the 90 MB model is loaded once, not once per classifier).
_shared: Embedder | None = None
_cache: dict[str, np.ndarray] = {}


def set_shared_embedder(embedder: Embedder) -> None:
    global _shared
    _shared = embedder
    _cache.clear()


def shared_embedder() -> Embedder:
    global _shared
    if _shared is None:
        _shared = Embedder()
    return _shared


class EmbeddingFeatures(BaseEstimator, TransformerMixin):
    """scikit-learn step that turns text into sentence-embedding features.

    Used next to TF-IDF in the classifiers: TF-IDF gives exact keywords (and the
    keyword explanations in the UI), embeddings let the model recognise
    paraphrases it never saw ("screeching shaft" ~ "grinding spindle")."""

    def __init__(self, weight: float = 2.0):
        self.weight = weight

    def fit(self, X, y=None):
        self.n_dims_ = self._encode(list(X)[:1]).shape[1]
        return self

    def transform(self, X):
        return sparse.csr_matrix(self._encode(list(X)) * self.weight)

    def get_feature_names_out(self, input_features=None):
        return np.array([f"dim{i}" for i in range(self.n_dims_)], dtype=object)

    @staticmethod
    def _encode(texts: list[str]) -> np.ndarray:
        missing = [t for t in dict.fromkeys(texts) if t not in _cache]
        if missing:
            if len(_cache) > 20000:  # keep a long-running server's memory bounded
                _cache.clear()
            for t, v in zip(missing, shared_embedder().encode(missing)):
                _cache[t] = v
        return np.vstack([_cache[t] for t in texts])
