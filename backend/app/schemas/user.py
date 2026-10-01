from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class UserBase(BaseModel):
    employee_id: str
    full_name: str = Field(validation_alias="name")
    email: str
    role_id: int
    department_id: Optional[int] = None
    status: Optional[str] = Field(
        default="ACTIVE",
        validation_alias="account_status"
    )


class UserCreate(BaseModel):
    employee_id: str
    full_name: str
    email: str
    role_id: int
    department_id: Optional[int] = None
    status: Optional[str] = "ACTIVE"
    password: str


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    role_id: Optional[int] = None
    department_id: Optional[int] = None
    status: Optional[str] = None
    password: Optional[str] = None


class UserResponse(UserBase):
    user_id: int
    created_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True
    )