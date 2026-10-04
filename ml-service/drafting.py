"""RCA (5-Why) and CAPA drafting, fully offline.

Drafts are built by retrieval: the ML engine finds the most similar resolved
incidents, and this module assembles their root causes and actions into a
structured draft, adding a 5-Why ladder specific to the predicted 6M category.

The result is only a *draft*: a human edits and approves it in the UI.
"""
from collections import Counter
from typing import Literal

from pydantic import BaseModel

RootCauseCategory = Literal["Man", "Machine", "Method", "Material", "Measurement", "Environment"]


class WhyStep(BaseModel):
    question: str
    answer: str


class RCADraft(BaseModel):
    problem_statement: str
    five_whys: list[WhyStep]
    root_cause: str
    root_cause_category: RootCauseCategory
    contributing_factors: list[str]
    containment_action: str
    evidence_ticket_ids: list[str]
    confidence_note: str


class CAPAAction(BaseModel):
    action: str
    owner_role: str
    due_in_days: int
    verification: str


class CAPADraft(BaseModel):
    corrective_actions: list[CAPAAction]
    preventive_actions: list[CAPAAction]
    effectiveness_check: str
    evidence_ticket_ids: list[str]


# Generic "why" questions for each 6M category: they walk from the symptom
# down to a systemic cause (the deeper whys of a 5-Why analysis).
WHY_LADDER = {
    "Machine": [
        "Why did the equipment fail? A component degraded beyond its working limit.",
        "Why was the degradation not caught? Condition checks did not cover this failure mode.",
        "Why not? The maintenance plan is calendar-based rather than condition-based.",
        "Why? Failure history for this machine type has not been fed back into the PM plan.",
    ],
    "Method": [
        "Why was the process done this way? The work instruction did not specify this step clearly.",
        "Why was it unclear? The SOP was not updated after the last process change.",
        "Why not? There is no trigger to review SOPs when settings or products change.",
        "Why? Change management does not include a document-review checkpoint.",
    ],
    "Material": [
        "Why was the material unsuitable or unavailable? Incoming material was not verified against spec.",
        "Why was it not verified? Incoming inspection is sample-based and skipped under time pressure.",
        "Why? Supplier quality and delivery performance is not reviewed regularly.",
        "Why? Supplier KPIs are not linked to the production plan.",
    ],
    "Measurement": [
        "Why was the measurement wrong? The gauge or sensor had drifted out of calibration.",
        "Why was the drift not detected? Calibration interval is longer than the observed drift time.",
        "Why? Measurement system analysis (MSA) has not been repeated since installation.",
        "Why? Calibration intervals are not reviewed using drift history.",
    ],
    "Environment": [
        "Why did the surroundings contribute? Conditions (leak, dust, temperature) were not controlled.",
        "Why not controlled? The source was not fixed and housekeeping missed it.",
        "Why? Shift checklists do not include this area or condition.",
        "Why? Environmental risks were not part of the last area risk assessment.",
    ],
    "Man": [
        "Why did the person act this way? They had not been trained on this specific task.",
        "Why not trained? The skills matrix does not flag this task as critical.",
        "Why? Training needs are not reviewed after incidents.",
        "Why? There is no link between incident learnings and the training plan.",
    ],
}

OWNER_BY_CATEGORY = {
    "Mechanical": "Maintenance Engineer", "Electrical": "Electrical Engineer",
    "Quality": "Quality Engineer", "Safety": "Safety Officer",
    "Process": "Process Engineer", "Automation": "Automation Engineer",
}
DUE_DAYS = {"Critical": 1, "High": 3, "Medium": 7, "Low": 14}


def _split_actions(text: str) -> list[str]:
    parts = [p.strip(" .") for chunk in str(text).split(";") for p in chunk.split(",")]
    return [p[0].upper() + p[1:] for p in parts if len(p) > 3]


def _anchor(cases: list[dict], rc_category: str) -> dict:
    """The closest past incident that shares the predicted root-cause category."""
    same = [c for c in cases if c["root_cause_category"] == rc_category]
    return (same or cases)[0]


def draft_rca(title: str, rc_category: str, cases: list[dict]) -> RCADraft:
    anchor = _anchor(cases, rc_category)
    ladder = WHY_LADDER[rc_category]
    whys = [WhyStep(question=f'Why did "{title}" happen?', answer=f"Because {anchor['root_cause'][0].lower()}{anchor['root_cause'][1:]}.")]
    whys += [WhyStep(question=q.split("? ")[0] + "?", answer=q.split("? ")[1]) for q in ladder]
    agreeing = [c["ticket_id"] for c in cases if c["root_cause_category"] == rc_category]
    return RCADraft(
        problem_statement=f"{title}. Similar to {len(cases)} past incidents; closest match {anchor['ticket_id']}.",
        five_whys=whys,
        root_cause=anchor["root_cause"],
        root_cause_category=rc_category,
        contributing_factors=[w.answer for w in whys[1:3]],
        containment_action=(_split_actions(anchor["corrective_action"]) or ["Isolate and inspect the equipment"])[0],
        evidence_ticket_ids=[c["ticket_id"] for c in cases],
        confidence_note=(
            f"{len(agreeing)} of {len(cases)} similar incidents share the '{rc_category}' root cause "
            "category. Verify on the floor before approving."
        ),
    )


def draft_capa(category: str, priority: str, rc_category: str, machine: str | None,
               cases: list[dict]) -> CAPADraft:
    """Rank the actions that closed similar incidents, weighted by how similar each incident is."""
    relevant = [c for c in cases if c["root_cause_category"] == rc_category] or cases
    weights_c, weights_p = Counter(), Counter()
    for c in relevant:
        for a in _split_actions(c["corrective_action"]):
            weights_c[a] += c["similarity"]
        for a in _split_actions(c["preventive_action"]):
            weights_p[a] += c["similarity"]
    owner = OWNER_BY_CATEGORY.get(category, "Maintenance Engineer")
    where = f" on {machine}" if machine else ""
    corrective = [
        CAPAAction(action=a, owner_role=owner, due_in_days=DUE_DAYS.get(priority, 7),
                   verification=f"Confirm the fault is cleared{where} and the line runs one full shift without recurrence.")
        for a, _ in weights_c.most_common(3)
    ]
    preventive = [
        CAPAAction(action=a, owner_role=owner, due_in_days=30,
                   verification="Audit that the change is in place on all similar machines.")
        for a, _ in weights_p.most_common(3)
    ]
    return CAPADraft(
        corrective_actions=corrective,
        preventive_actions=preventive,
        effectiveness_check=f"No recurrence of this issue type{where} for 60 days; review at the next monthly quality meeting.",
        evidence_ticket_ids=[c["ticket_id"] for c in relevant],
    )
