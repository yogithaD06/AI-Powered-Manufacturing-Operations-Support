"""Train every model the ML service uses and save them to models/.

    python train.py

What it does:
1. Loads the synthetic tickets (data/tickets.csv) plus any human-approved
   RCA/CAPA feedback saved from the UI (ml_store.db) -> the feedback loop.
2. Trains 3 text classifiers (Logistic Regression on TF-IDF + sentence-embedding
   features): category, priority, root-cause category (6M).
   Each one is evaluated on a held-out 20% test split (accuracy, macro F1,
   confusion matrix) and on data/paraphrase_eval.csv: 18 hand-written incidents
   worded differently from the training templates. Then it is refit on all data.
3. Embeds every ticket with all-MiniLM-L6-v2 for similarity search.
4. Clusters the embeddings (K-Means, k picked by silhouette score) with machine
   names removed, so clusters are issue *types* -> recurring-issues dashboard.

The data is synthetic: the scores prove the pipeline works end to end,
not that it would reach this accuracy on a real plant's tickets.
"""
import json
import re
from datetime import datetime

import joblib
import numpy as np
import pandas as pd
from sklearn.cluster import KMeans
from sklearn.dummy import DummyClassifier
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix, f1_score, silhouette_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import FeatureUnion, Pipeline

import store
from config import CATEGORIES, DATA_DIR, MACHINES_CSV, MODELS_DIR, PRIORITIES, ROOT_CAUSE_CATEGORIES, TICKETS_CSV
from embeddings import Embedder, EmbeddingFeatures, set_shared_embedder
from text_utils import clean, incident_text

TARGETS = {
    "category": CATEGORIES,
    "priority": PRIORITIES,
    "root_cause_category": ROOT_CAUSE_CATEGORIES,
}


def load_knowledge_base() -> pd.DataFrame:
    df = pd.read_csv(TICKETS_CSV)
    df["source"] = "historical"

    feedback = pd.DataFrame(store.list_feedback())
    if not feedback.empty:
        feedback = feedback.rename(columns={"id": "feedback_id"})
        feedback["ticket_id"] = "FB-" + feedback["feedback_id"].astype(str)
        feedback["source"] = "approved_feedback"
        feedback["status"] = "Closed"
        df = pd.concat([df, feedback[[c for c in feedback.columns if c in df.columns]]], ignore_index=True)

    df["text"] = [incident_text(t, d) for t, d in zip(df["title"], df["description"].fillna(""))]
    df["clean_text"] = df["text"].map(clean)
    return df.reset_index(drop=True)


def load_paraphrase_eval() -> pd.DataFrame:
    ev = pd.read_csv(DATA_DIR / "paraphrase_eval.csv")
    ev["clean_text"] = [clean(incident_text(t, d)) for t, d in zip(ev["title"], ev["description"])]
    return ev


def make_classifier() -> Pipeline:
    # Word n-grams capture phrases ("oil leak"); character n-grams make the
    # model robust to the typos operators make ("overheting"); sentence
    # embeddings let it recognise paraphrases of known problems.
    features = FeatureUnion([
        ("word", TfidfVectorizer(ngram_range=(1, 2), sublinear_tf=True, min_df=1)),
        ("char", TfidfVectorizer(analyzer="char_wb", ngram_range=(3, 5), sublinear_tf=True, min_df=2)),
        ("emb", EmbeddingFeatures()),
    ])
    clf = LogisticRegression(max_iter=3000, C=5.0, class_weight="balanced")
    return Pipeline([("features", features), ("clf", clf)])


def train_classifier(df: pd.DataFrame, target: str, labels: list[str],
                     paraphrases: pd.DataFrame) -> tuple[Pipeline, dict]:
    data = df[df[target].isin(labels)]
    X, y = data["clean_text"], data[target]
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    model = make_classifier().fit(X_train, y_train)
    pred = model.predict(X_test)
    baseline = DummyClassifier(strategy="most_frequent").fit(X_train, y_train).predict(X_test)
    present = [l for l in labels if l in set(y)]
    cm = confusion_matrix(y_test, pred, labels=present)

    metrics = {
        "target": target,
        "train_rows": int(len(X_train)),
        "test_rows": int(len(X_test)),
        "accuracy": round(float(accuracy_score(y_test, pred)), 4),
        "macro_f1": round(float(f1_score(y_test, pred, average="macro")), 4),
        "baseline_accuracy": round(float(accuracy_score(y_test, baseline)), 4),
        "labels": present,
        "confusion_matrix": cm.tolist(),
    }
    if target in paraphrases.columns:
        para_pred = model.predict(paraphrases["clean_text"])
        metrics["out_of_template_accuracy"] = round(float((para_pred == paraphrases[target]).mean()), 4)
        metrics["out_of_template_rows"] = int(len(paraphrases))

    print(f"\n=== {target} ===")
    print(f"accuracy {metrics['accuracy']:.3f} | macro F1 {metrics['macro_f1']:.3f} "
          f"| majority-class baseline {metrics['baseline_accuracy']:.3f}"
          + (f" | out-of-template {metrics['out_of_template_accuracy']:.3f}"
             if "out_of_template_accuracy" in metrics else ""))
    print(classification_report(y_test, pred, labels=present, zero_division=0))
    print("confusion matrix (rows = actual, cols = predicted):")
    print(pd.DataFrame(cm, index=present, columns=present).to_string())

    # Final model is refit on all rows: the split was only for honest scoring.
    return make_classifier().fit(X, y), metrics


def strip_machines(texts: pd.Series) -> list[str]:
    """Remove machine ids/types/lines so clusters group by problem, not by machine."""
    machines = pd.read_csv(MACHINES_CSV)
    names = set(machines["machine_id"]) | set(machines["machine_type"]) | set(machines["line"])
    pattern = re.compile("|".join(re.escape(n) for n in sorted(names, key=len, reverse=True)), re.IGNORECASE)
    return [re.sub(r"\(\s*\)", " ", pattern.sub(" ", t)) for t in texts]


def cluster(vectors: np.ndarray) -> tuple[np.ndarray, int, float]:
    best = (None, 0, -1.0)
    for k in range(8, 25, 2):
        km = KMeans(n_clusters=k, n_init=10, random_state=42).fit(vectors)
        score = silhouette_score(vectors, km.labels_, sample_size=min(1000, len(vectors)), random_state=42)
        if score > best[2]:
            best = (km.labels_, k, float(score))
    print(f"\nclusters: k={best[1]} (silhouette {best[2]:.3f})")
    return best


def main() -> dict:
    MODELS_DIR.mkdir(exist_ok=True)
    df = load_knowledge_base()
    print(f"knowledge base: {len(df)} tickets ({(df['source'] == 'approved_feedback').sum()} from human feedback)")

    embedder = Embedder().fit(df["text"].tolist())
    set_shared_embedder(embedder)  # also used by the classifiers' embedding features

    paraphrases = load_paraphrase_eval()
    all_metrics = {}
    for target, labels in TARGETS.items():
        model, metrics = train_classifier(df, target, labels, paraphrases)
        joblib.dump(model, MODELS_DIR / f"{target}_clf.joblib")
        all_metrics[target] = metrics

    print("\nembedding tickets ...")
    vectors = embedder.encode(df["text"].tolist())
    np.save(MODELS_DIR / "embeddings.npy", vectors)
    joblib.dump(embedder, MODELS_DIR / "embedder.joblib")

    labels, k, silhouette = cluster(embedder.encode(strip_machines(df["text"])))
    df["cluster"] = labels
    df.drop(columns=["clean_text"]).to_pickle(MODELS_DIR / "knowledge_base.pkl")

    meta = {
        "trained_at": datetime.now().isoformat(timespec="seconds"),
        "model_version": datetime.now().strftime("v%Y%m%d-%H%M%S"),
        "rows": int(len(df)),
        "feedback_rows": int((df["source"] == "approved_feedback").sum()),
        "embedding": embedder.kind,
        "clusters": {"k": int(k), "silhouette": round(silhouette, 4)},
        "classifiers": all_metrics,
        "note": (
            "Synthetic data: scores show the pipeline works, not real-world accuracy. "
            "Category and root-cause tickets come from 18 scenario templates, so the test "
            "split contains paraphrases of training tickets and near-perfect scores are expected; "
            "the out-of-template score (18 hand-written incidents) is the more honest number. "
            "Priority is only weakly signalled in the text (impact phrases with noise), so it scores lower."
        ),
    }
    (MODELS_DIR / "metrics.json").write_text(json.dumps(meta, indent=2))
    store.mark_feedback_trained()
    print(f"\nsaved models to {MODELS_DIR} ({meta['model_version']})")
    return meta


if __name__ == "__main__":
    main()
