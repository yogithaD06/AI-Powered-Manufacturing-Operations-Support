from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class ResolutionRecordBase(BaseModel):
    incident_id: int
    ticket_id: Optional[int] = None

    resolution_description: Optional[str] = None
    resolution_method: Optional[str] = None
    parts_resources_used: Optional[str] = None
    resolution_notes: Optional[str] = None

    resolved_by: Optional[int] = None
    resolved_at: Optional[datetime] = None

    verification_result: Optional[str] = None
    verification_status: Optional[str] = None

    verified_by: Optional[int] = None
    verification_date: Optional[datetime] = None

    closure_notes: Optional[str] = None
    closure_status: Optional[str] = None


class ResolutionRecordCreate(ResolutionRecordBase):
    pass


class ResolutionRecordUpdate(BaseModel):
    ticket_id: Optional[int] = None

    resolution_description: Optional[str] = None
    resolution_method: Optional[str] = None
    parts_resources_used: Optional[str] = None
    resolution_notes: Optional[str] = None

    resolved_by: Optional[int] = None
    resolved_at: Optional[datetime] = None

    verification_result: Optional[str] = None
    verification_status: Optional[str] = None

    verified_by: Optional[int] = None
    verification_date: Optional[datetime] = None

    closure_notes: Optional[str] = None
    closure_status: Optional[str] = None


class ResolutionRecordResponse(ResolutionRecordBase):
    resolution_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)