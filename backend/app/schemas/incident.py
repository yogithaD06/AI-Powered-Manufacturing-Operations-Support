from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class IncidentBase(BaseModel):
    incident_title: str
    incident_description: Optional[str] = None

    issue_category_id: int
    machine_id: int
    reported_by: int

    priority: Optional[str] = "MEDIUM"
    status: Optional[str] = "OPEN"

    occurrence_time: datetime
    reported_time: Optional[datetime] = None

    production_impact: Optional[str] = None
    safety_impact: Optional[str] = None


class IncidentCreate(IncidentBase):
    pass


class IncidentUpdate(BaseModel):
    incident_title: Optional[str] = None
    incident_description: Optional[str] = None

    issue_category_id: Optional[int] = None
    machine_id: Optional[int] = None
    reported_by: Optional[int] = None

    priority: Optional[str] = None
    status: Optional[str] = None

    occurrence_time: Optional[datetime] = None
    reported_time: Optional[datetime] = None

    production_impact: Optional[str] = None
    safety_impact: Optional[str] = None


class IncidentResponse(IncidentBase):
    incident_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)