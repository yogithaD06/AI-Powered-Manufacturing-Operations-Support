from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class DowntimeRecordBase(BaseModel):
    incident_id: int
    machine_id: int
    line_id: int

    downtime_reason: Optional[str] = None
    downtime_category: Optional[str] = None

    start_time: datetime
    end_time: Optional[datetime] = None

    duration_minutes: Optional[float] = None
    production_units_affected: Optional[int] = None
    production_loss: Optional[float] = None

    impact_description: Optional[str] = None


class DowntimeRecordCreate(DowntimeRecordBase):
    pass


class DowntimeRecordUpdate(BaseModel):
    machine_id: Optional[int] = None
    line_id: Optional[int] = None

    downtime_reason: Optional[str] = None
    downtime_category: Optional[str] = None

    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None

    duration_minutes: Optional[float] = None
    production_units_affected: Optional[int] = None
    production_loss: Optional[float] = None

    impact_description: Optional[str] = None


class DowntimeRecordResponse(DowntimeRecordBase):
    downtime_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)