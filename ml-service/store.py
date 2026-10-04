"""Tiny SQLite store for the human-in-the-loop parts of the demo.

- feedback:    RCA/CAPA results a human approved (or edited). Used as extra
               training data by train.py -> this is the feedback loop.
- assignments: tickets an engineer accepted via the recommender. Open ones
               count as current workload in the assignee score.
"""
import sqlite3
from contextlib import contextmanager
from datetime import datetime

from config import DB_PATH

SCHEMA = """
CREATE TABLE IF NOT EXISTS feedback (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,
    priority TEXT,
    root_cause_category TEXT,
    root_cause TEXT,
    corrective_action TEXT,
    preventive_action TEXT,
    source TEXT,
    used_in_training INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS assignments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at TEXT NOT NULL,
    engineer TEXT NOT NULL,
    ticket_ref TEXT,
    status TEXT NOT NULL DEFAULT 'OPEN'
);
"""


@contextmanager
def connect():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        conn.executescript(SCHEMA)
        yield conn
        conn.commit()
    finally:
        conn.close()


def _now() -> str:
    return datetime.now().isoformat(timespec="seconds")


def add_feedback(item: dict) -> int:
    cols = [
        "title", "description", "category", "priority", "root_cause_category",
        "root_cause", "corrective_action", "preventive_action", "source",
    ]
    with connect() as conn:
        cur = conn.execute(
            f"INSERT INTO feedback (created_at, {', '.join(cols)}) "
            f"VALUES (?, {', '.join('?' for _ in cols)})",
            [_now(), *(item.get(c) for c in cols)],
        )
        return cur.lastrowid


def list_feedback() -> list[dict]:
    with connect() as conn:
        return [dict(r) for r in conn.execute("SELECT * FROM feedback ORDER BY id")]


def feedback_stats() -> dict:
    with connect() as conn:
        total, pending = conn.execute(
            "SELECT COUNT(*), COALESCE(SUM(used_in_training = 0), 0) FROM feedback"
        ).fetchone()
    return {"total": total, "pending_retrain": pending}


def mark_feedback_trained() -> None:
    with connect() as conn:
        conn.execute("UPDATE feedback SET used_in_training = 1")


def add_assignment(engineer: str, ticket_ref: str | None) -> int:
    with connect() as conn:
        cur = conn.execute(
            "INSERT INTO assignments (created_at, engineer, ticket_ref) VALUES (?, ?, ?)",
            (_now(), engineer, ticket_ref),
        )
        return cur.lastrowid


def close_assignment(assignment_id: int) -> bool:
    with connect() as conn:
        cur = conn.execute(
            "UPDATE assignments SET status = 'CLOSED' WHERE id = ?", (assignment_id,)
        )
        return cur.rowcount > 0


def open_workload() -> dict[str, int]:
    with connect() as conn:
        rows = conn.execute(
            "SELECT engineer, COUNT(*) AS n FROM assignments WHERE status = 'OPEN' GROUP BY engineer"
        )
        return {r["engineer"]: r["n"] for r in rows}


def list_open_assignments() -> list[dict]:
    with connect() as conn:
        return [
            dict(r)
            for r in conn.execute("SELECT * FROM assignments WHERE status = 'OPEN' ORDER BY id DESC")
        ]
