from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class IncidentActivityLogBase(BaseModel):
    incident_id: int
    ticket_id: Optional[int] = None
    user_id: int

    action_type: Optional[str] = None
    old_value: Optional[str] = None
    new_value: Optional[str] = None
    comments: Optional[str] = None


class IncidentActivityLogCreate(IncidentActivityLogBase):
    pass


class IncidentActivityLogUpdate(BaseModel):
    action_type: Optional[str] = None
    old_value: Optional[str] = None
    new_value: Optional[str] = None
    comments: Optional[str] = None


class IncidentActivityLogResponse(IncidentActivityLogBase):
    activity_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)