from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class TicketBase(BaseModel):
    incident_id: int

    assigned_to: Optional[int] = None
    assigned_department_id: Optional[int] = None

    ticket_type: Optional[str] = None
    priority: Optional[str] = "MEDIUM"
    status: Optional[str] = "OPEN"

    due_date: Optional[datetime] = None
    resolution_summary: Optional[str] = None


class TicketCreate(TicketBase):
    pass


class TicketUpdate(BaseModel):
    assigned_to: Optional[int] = None
    assigned_department_id: Optional[int] = None

    ticket_type: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None

    due_date: Optional[datetime] = None
    resolution_summary: Optional[str] = None


class TicketResponse(TicketBase):
    ticket_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)