from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class ProductionLineBase(BaseModel):
    line_name: str
    department_id: int
    location: Optional[str] = None
    status: Optional[str] = "ACTIVE"


class ProductionLineCreate(ProductionLineBase):
    pass


class ProductionLineUpdate(BaseModel):
    line_name: Optional[str] = None
    department_id: Optional[int] = None
    location: Optional[str] = None
    status: Optional[str] = None


class ProductionLineResponse(ProductionLineBase):
    line_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)