from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class CAPARecordBase(BaseModel):
    incident_id: int

    action_type: Optional[str] = None
    action_description: Optional[str] = None
    assigned_to: Optional[int] = None

    target_date: Optional[date] = None
    completion_date: Optional[date] = None

    status: Optional[str] = "OPEN"

    verification_notes: Optional[str] = None
    verification_result: Optional[str] = None

    verified_by: Optional[int] = None
    verification_date: Optional[datetime] = None
    effectiveness_status: Optional[str] = None


class CAPARecordCreate(CAPARecordBase):
    pass


class CAPARecordUpdate(BaseModel):
    action_type: Optional[str] = None
    action_description: Optional[str] = None
    assigned_to: Optional[int] = None

    target_date: Optional[date] = None
    completion_date: Optional[date] = None

    status: Optional[str] = None

    verification_notes: Optional[str] = None
    verification_result: Optional[str] = None

    verified_by: Optional[int] = None
    verification_date: Optional[datetime] = None
    effectiveness_status: Optional[str] = None


class CAPARecordResponse(CAPARecordBase):
    capa_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)