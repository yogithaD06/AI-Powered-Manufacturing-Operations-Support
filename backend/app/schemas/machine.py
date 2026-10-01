from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class MachineBase(BaseModel):
    machine_name: str
    machine_code: str
    machine_type: Optional[str] = None
    line_id: int
    department_id: int
    location: Optional[str] = None
    installation_date: Optional[date] = None
    status: Optional[str] = "ACTIVE"


class MachineCreate(MachineBase):
    pass


class MachineUpdate(BaseModel):
    machine_name: Optional[str] = None
    machine_code: Optional[str] = None
    machine_type: Optional[str] = None
    line_id: Optional[int] = None
    department_id: Optional[int] = None
    location: Optional[str] = None
    installation_date: Optional[date] = None
    status: Optional[str] = None


class MachineResponse(MachineBase):
    machine_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)