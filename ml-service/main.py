"""ML service for the MES Support app.

    uvicorn main:app --reload --port 8001

The React app reaches it through the Vite proxy at /ml (see frontend/vite.config.ts).
Interactive API docs: http://127.0.0.1:8001/docs
"""
import threading
from datetime import datetime

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

import drafting
import store
import train
from config import FRONTEND_ORIGINS
from engine import Engine

app = FastAPI(title="MES Support - ML Service", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=FRONTEND_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)

engine = Engine()
retrain_state = {"running": False, "last_error": None, "last_finished": None}
_retrain_lock = threading.Lock()


def require_models() -> None:
    if not engine.ready:
        raise HTTPException(503, "Models not trained yet. Run `python train.py` in ml-service/.")


# ------------------------------------------------------------------ schemas
class IncidentIn(BaseModel):
    title: str = Field(min_length=3)
    description: str | None = None


class SimilarIn(IncidentIn):
    top_k: int = Field(5, ge=1, le=20)


class AssigneeIn(IncidentIn):
    category: str | None = None


class CapaIn(IncidentIn):
    category: str | None = None
    priority: str | None = None
    root_cause_category: str | None = None
    machine: str | None = None


class AssignmentIn(BaseModel):
    engineer: str
    ticket_ref: str | None = None


class FeedbackIn(BaseModel):
    title: str
    description: str | None = None
    category: str | None = None
    priority: str | None = None
    root_cause_category: str | None = None
    root_cause: str | None = None
    corrective_action: str | None = None
    preventive_action: str | None = None
    source: str = "ui"


# ------------------------------------------------------------------ endpoints
@app.get("/health")
def health():
    return {
        "status": "ok" if engine.ready else "untrained",
        "model_version": engine.metrics["model_version"] if engine.ready else None,
    }


@app.get("/model-info")
def model_info():
    require_models()
    return {**engine.metrics, "feedback": store.feedback_stats(), "retrain": retrain_state}


@app.post("/classify")
def classify(body: IncidentIn):
    require_models()
    return engine.classify(body.title, body.description)


@app.post("/similar")
def similar(body: SimilarIn):
    require_models()
    return {"results": engine.similar(body.title, body.description, top_k=body.top_k)}


@app.post("/recommend-assignee")
def recommend_assignee(body: AssigneeIn):
    require_models()
    return engine.recommend_assignee(body.title, body.description, body.category)


@app.post("/rca")
def rca(body: IncidentIn):
    """Predict the 6M root-cause category, retrieve similar resolved incidents, draft a 5-Why."""
    require_models()
    prediction = engine.classify(body.title, body.description)
    cases = engine.similar(body.title, body.description, top_k=5)
    draft = drafting.draft_rca(body.title, prediction["root_cause_category"]["label"], cases)
    return {
        "prediction": prediction,
        "similar_incidents": cases,
        "draft": draft.model_dump(),
    }


@app.post("/capa")
def capa(body: CapaIn):
    """Retrieve past CAPAs for the same kind of root cause and draft corrective + preventive actions."""
    require_models()
    prediction = engine.classify(body.title, body.description)
    category = body.category or prediction["category"]["label"]
    priority = body.priority or prediction["priority"]["label"]
    rc_category = body.root_cause_category or prediction["root_cause_category"]["label"]
    cases = engine.similar(body.title, body.description, top_k=5, root_cause_category=rc_category)
    draft = drafting.draft_capa(category, priority, rc_category, body.machine, cases)
    return {
        "inputs": {"category": category, "priority": priority, "root_cause_category": rc_category},
        "similar_incidents": cases,
        "draft": draft.model_dump(),
    }


@app.get("/recurring")
def recurring(window_days: int = 90, min_count: int = 3):
    require_models()
    return engine.recurring(window_days, min_count)


@app.get("/assignments")
def assignments():
    return {"open": store.list_open_assignments(), "workload": store.open_workload()}


@app.post("/assignments")
def accept_assignment(body: AssignmentIn):
    return {"id": store.add_assignment(body.engineer, body.ticket_ref)}


@app.post("/assignments/{assignment_id}/close")
def close_assignment(assignment_id: int):
    if not store.close_assignment(assignment_id):
        raise HTTPException(404, "Assignment not found")
    return {"closed": assignment_id}


@app.post("/feedback")
def feedback(body: FeedbackIn):
    """Save a human-approved RCA/CAPA. It joins the training data on the next retrain."""
    return {"id": store.add_feedback(body.model_dump()), "stats": store.feedback_stats()}


def _run_retrain() -> None:
    try:
        train.main()
        engine.load()
        retrain_state["last_error"] = None
    except Exception as exc:  # report to the UI instead of crashing the server
        retrain_state["last_error"] = str(exc)
    finally:
        retrain_state["running"] = False
        retrain_state["last_finished"] = datetime.now().isoformat(timespec="seconds")
        _retrain_lock.release()


@app.post("/retrain")
def retrain():
    if not _retrain_lock.acquire(blocking=False):
        raise HTTPException(409, "A retrain is already running")
    retrain_state["running"] = True
    threading.Thread(target=_run_retrain, daemon=True).start()
    return retrain_state


@app.get("/retrain/status")
def retrain_status():
    return {**retrain_state, "model_version": engine.metrics["model_version"] if engine.ready else None}
