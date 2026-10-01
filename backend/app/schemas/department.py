from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class DepartmentBase(BaseModel):
    department_name: str
    description: Optional[str] = None
    location: Optional[str] = None
    status: Optional[str] = "ACTIVE"


class DepartmentCreate(DepartmentBase):
    pass


class DepartmentUpdate(BaseModel):
    department_name: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None
    status: Optional[str] = None


class DepartmentResponse(DepartmentBase):
    department_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)