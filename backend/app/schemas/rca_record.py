from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class RCARecordBase(BaseModel):
    incident_id: int

    investigation_notes: Optional[str] = None
    investigation_method: Optional[str] = None
    evidence_observations: Optional[str] = None
    contributing_factors: Optional[str] = None

    root_cause: Optional[str] = None
    root_cause_category: Optional[str] = None
    corrective_action_required: Optional[str] = None
    rca_findings: Optional[str] = None

    identified_by: Optional[int] = None

    status: Optional[str] = "OPEN"
    completed_at: Optional[datetime] = None


class RCARecordCreate(RCARecordBase):
    pass


class RCARecordUpdate(BaseModel):
    investigation_notes: Optional[str] = None
    investigation_method: Optional[str] = None
    evidence_observations: Optional[str] = None
    contributing_factors: Optional[str] = None

    root_cause: Optional[str] = None
    root_cause_category: Optional[str] = None
    corrective_action_required: Optional[str] = None
    rca_findings: Optional[str] = None

    identified_by: Optional[int] = None

    status: Optional[str] = None
    completed_at: Optional[datetime] = None


class RCARecordResponse(RCARecordBase):
    rca_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)