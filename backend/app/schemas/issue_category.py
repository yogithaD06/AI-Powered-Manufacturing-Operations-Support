from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class IssueCategoryBase(BaseModel):
    category_name: str
    subcategory_name: Optional[str] = None
    description: Optional[str] = None
    severity_level: Optional[str] = None
    status: Optional[str] = "ACTIVE"


class IssueCategoryCreate(IssueCategoryBase):
    pass


class IssueCategoryUpdate(BaseModel):
    category_name: Optional[str] = None
    subcategory_name: Optional[str] = None
    description: Optional[str] = None
    severity_level: Optional[str] = None
    status: Optional[str] = None


class IssueCategoryResponse(IssueCategoryBase):
    category_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)