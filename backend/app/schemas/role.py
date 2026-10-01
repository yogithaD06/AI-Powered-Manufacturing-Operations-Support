from datetime import datetime
from typing import Optional, Any

from pydantic import BaseModel, ConfigDict


class RoleBase(BaseModel):
    role_name: str
    role_description: Optional[str] = None
    permissions: Optional[Any] = None


class RoleCreate(RoleBase):
    pass


class RoleUpdate(BaseModel):
    role_name: Optional[str] = None
    role_description: Optional[str] = None
    permissions: Optional[Any] = None


class RoleResponse(RoleBase):
    role_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)