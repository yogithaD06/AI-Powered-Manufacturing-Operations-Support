"""Loads the trained artifacts from models/ and answers every ML question the API asks."""
import json
from datetime import datetime, timedelta

import joblib
import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import ENGLISH_STOP_WORDS, TfidfVectorizer

import store
from config import MACHINES_CSV, MODELS_DIR, USERS_CSV
from embeddings import set_shared_embedder
from text_utils import clean, incident_text

DUPLICATE_THRESHOLD = 0.92  # cosine similarity above which we flag a likely duplicate
# Words too generic to be a useful explanation, even when the model weighs them.
GENERIC_WORDS = ENGLISH_STOP_WORDS | {"operator", "noticed", "reported", "line", "machine", "seen", "today", "looks"}


class Engine:
    def __init__(self):
        self.ready = False
        self.load()

    # ------------------------------------------------------------------ loading
    def load(self) -> None:
        if not (MODELS_DIR / "metrics.json").exists():
            print("[engine] no trained models found - run `python train.py` first")
            return
        self.classifiers = {
            t: joblib.load(MODELS_DIR / f"{t}_clf.joblib")
            for t in ("category", "priority", "root_cause_category")
        }
        self.embedder = joblib.load(MODELS_DIR / "embedder.joblib")
        set_shared_embedder(self.embedder)  # the classifiers' embedding features use it too
        self.vectors = np.load(MODELS_DIR / "embeddings.npy")
        self.kb = pd.read_pickle(MODELS_DIR / "knowledge_base.pkl")
        self.kb["created_at"] = pd.to_datetime(self.kb["created_at"], errors="coerce")
        self.metrics = json.loads((MODELS_DIR / "metrics.json").read_text())
        self.users = pd.read_csv(USERS_CSV)
        self.users["skills"] = self.users["skills"].str.split("|")
        self.machines = pd.read_csv(MACHINES_CSV)
        self.cluster_names = self._name_clusters()
        self.ready = True
        print(f"[engine] loaded {self.metrics['model_version']} ({len(self.kb)} tickets, {self.embedder.kind})")

    # ------------------------------------------------------------ classification
    def _explain(self, model, text: str, class_index: int, n: int = 5) -> list[str]:
        """Words that pushed the prediction toward this class (TF-IDF value x model weight)."""
        features = model.named_steps["features"]
        coef = model.named_steps["clf"].coef_[class_index]
        x = features.transform([text]).tocoo()
        names = features.get_feature_names_out()
        scored = [
            (names[j].removeprefix("word__"), v * coef[j])
            for j, v in zip(x.col, x.data)
            if names[j].startswith("word__") and v * coef[j] > 0
            and not set(names[j].removeprefix("word__").split()) <= GENERIC_WORDS
        ]
        scored.sort(key=lambda s: -s[1])
        return [w for w, _ in scored[:n]]

    def _predict(self, target: str, text: str) -> dict:
        model = self.classifiers[target]
        probs = model.predict_proba([text])[0]
        classes = list(model.classes_)
        order = np.argsort(probs)[::-1]
        best = order[0]
        return {
            "label": classes[best],
            "confidence": round(float(probs[best]), 4),
            "alternatives": [
                {"label": classes[i], "probability": round(float(probs[i]), 4)} for i in order
            ],
            "keywords": self._explain(model, text, best),
        }

    def classify(self, title: str, description: str | None) -> dict:
        text = clean(incident_text(title, description))
        return {t: self._predict(t, text) for t in self.classifiers}

    # ---------------------------------------------------------------- similarity
    def _row(self, i: int, sim: float) -> dict:
        r = self.kb.iloc[i]
        val = lambda k: None if pd.isna(r.get(k)) else r.get(k)  # noqa: E731
        return {
            "ticket_id": val("ticket_id"),
            "title": val("title"),
            "description": val("description"),
            "machine_id": val("machine_id"),
            "line": val("line"),
            "category": val("category"),
            "priority": val("priority"),
            "root_cause_category": val("root_cause_category"),
            "root_cause": val("root_cause"),
            "corrective_action": val("corrective_action"),
            "preventive_action": val("preventive_action"),
            "assigned_to": val("assigned_to"),
            "resolution_hours": None if pd.isna(r.get("resolution_hours")) else float(r["resolution_hours"]),
            "created_at": r["created_at"].isoformat() if not pd.isna(r["created_at"]) else None,
            "source": val("source"),
            "similarity": round(float(sim), 4),
        }

    def _similarities(self, title: str, description: str | None) -> np.ndarray:
        query = self.embedder.encode([incident_text(title, description)])[0]
        return self.vectors @ query

    def similar(self, title: str, description: str | None, top_k: int = 5,
                root_cause_category: str | None = None) -> list[dict]:
        sims = self._similarities(title, description)
        order = np.argsort(sims)[::-1]
        results = []
        for i in order:
            if root_cause_category and self.kb.iloc[i]["root_cause_category"] != root_cause_category:
                continue
            row = self._row(i, sims[i])
            row["possible_duplicate"] = row["similarity"] >= DUPLICATE_THRESHOLD
            results.append(row)
            if len(results) == top_k:
                break
        return results

    # ------------------------------------------------------------------ assignee
    def recommend_assignee(self, title: str, description: str | None, category: str | None = None,
                           now: datetime | None = None, top_n: int = 3) -> dict:
        """Explainable weighted score:
            0.40 x skill match   (is the ticket category one of their skills?)
          + 0.35 x experience    (how many of the 30 most similar past tickets they resolved)
          + 0.25 x availability  (fewer open tickets is better; off-shift is penalised)
        """
        category = category or self.classify(title, description)["category"]["label"]
        sims = self._similarities(title, description)
        top = np.argsort(sims)[::-1][:30]
        similar = self.kb.iloc[top].assign(similarity=sims[top])
        workload = store.open_workload()
        now = now or datetime.now()
        current_shift = "Day" if 6 <= now.hour < 18 else "Night"

        handled = similar.groupby("assigned_to")["similarity"].agg(["count", "sum"])
        best_weight = handled["sum"].max() if not handled.empty else 1.0

        candidates = []
        for _, u in self.users.iterrows():
            skills = u["skills"]
            skill = 1.0 if skills[0] == category else 0.8 if category in skills else 0.0
            n_similar = int(handled["count"].get(u["name"], 0))
            experience = float(handled["sum"].get(u["name"], 0.0) / best_weight)
            open_tickets = workload.get(u["name"], 0)
            on_shift = u["shift"] == current_shift
            availability = (1 / (1 + open_tickets)) * (1.0 if on_shift else 0.7)
            score = 0.40 * skill + 0.35 * experience + 0.25 * availability

            past = similar[similar["assigned_to"] == u["name"]]["resolution_hours"]
            reasons = [
                f"{category} is their primary skill" if skill == 1.0
                else f"{category} is a secondary skill" if skill
                else f"No {category} skill listed ({', '.join(skills)})",
                f"Resolved {n_similar} of the 30 most similar past incidents"
                + (f" (avg {past.mean():.1f} h)" if n_similar else ""),
                f"{open_tickets} open ticket{'s' if open_tickets != 1 else ''} right now",
                f"{u['shift']} shift ({'on shift now' if on_shift else 'off shift now'})",
            ]
            candidates.append({
                "name": u["name"],
                "role": u["role"],
                "skills": skills,
                "shift": u["shift"],
                "score": round(score, 4),
                "components": {
                    "skill_match": round(skill, 3),
                    "experience": round(experience, 3),
                    "availability": round(availability, 3),
                },
                "open_tickets": open_tickets,
                "similar_resolved": n_similar,
                "reasons": reasons,
            })
        candidates.sort(key=lambda c: -c["score"])
        return {
            "category": category,
            "weights": {"skill_match": 0.40, "experience": 0.35, "availability": 0.25},
            "recommendations": candidates[:top_n],
        }

    # ------------------------------------------------------------------ recurring
    def _name_clusters(self) -> dict[int, list[str]]:
        """Name each cluster by its most distinctive words (class-based TF-IDF)."""
        machine_words = set()
        for _, m in self.machines.iterrows():
            machine_words |= set(clean(f"{m['machine_id']} {m['machine_type']} {m['line']}").split())
        docs = self.kb.groupby("cluster")["title"].apply(lambda t: " ".join(t.map(clean)))
        stop = list(machine_words | {"on", "at", "from", "with", "the", "and", "of", "in", "near", "line"})
        vec = TfidfVectorizer(stop_words=stop, token_pattern=r"(?u)\b[a-z][a-z]{2,}\b")
        tfidf = vec.fit_transform(docs.values)
        names = vec.get_feature_names_out()
        return {
            int(c): [names[j] for j in np.argsort(tfidf[k].toarray()[0])[::-1][:3]]
            for k, c in enumerate(docs.index)
        }

    def recurring(self, window_days: int = 90, min_count: int = 3) -> dict:
        """Issue types (clusters) ranked by how often they occurred in the last `window_days`,
        compared with the window before, plus the machines where they keep repeating.

        "Now" is the newest ticket date in the data, so the synthetic history stays meaningful."""
        kb = self.kb.dropna(subset=["created_at"])
        ref = kb["created_at"].max()
        start, prev_start = ref - timedelta(days=window_days), ref - timedelta(days=2 * window_days)
        recent = kb[kb["created_at"] > start]
        previous = kb[(kb["created_at"] > prev_start) & (kb["created_at"] <= start)]

        clusters = []
        for cid, group in recent.groupby("cluster"):
            if len(group) < min_count:
                continue
            prev_count = int((previous["cluster"] == cid).sum())
            machines = group["machine_id"].value_counts()
            repeat = machines[machines >= 2]
            idx = group.index
            centroid = self.vectors[idx].mean(axis=0)
            rep = idx[int(np.argmax(self.vectors[idx] @ centroid))]
            clusters.append({
                "cluster_id": int(cid),
                "name": " / ".join(self.cluster_names.get(int(cid), [])),
                "example_title": kb.loc[rep, "title"],
                "count": int(len(group)),
                "previous_count": prev_count,
                "trend_pct": round((len(group) - prev_count) / prev_count * 100, 1) if prev_count else None,
                "category": group["category"].mode().iat[0],
                "dominant_root_cause": group["root_cause"].mode().iat[0],
                "root_cause_category": group["root_cause_category"].mode().iat[0],
                "avg_resolution_hours": round(float(group["resolution_hours"].mean()), 1),
                "total_downtime_hours": round(float(group["resolution_hours"].sum()), 1),
                "repeat_machines": [{"machine_id": m, "count": int(n)} for m, n in repeat.items()],
                "last_seen": group["created_at"].max().isoformat(),
            })
        clusters.sort(key=lambda c: -c["count"])
        return {
            "window_days": window_days,
            "reference_date": ref.isoformat(),
            "window_start": start.isoformat(),
            "total_incidents": int(len(recent)),
            "clusters": clusters,
        }

