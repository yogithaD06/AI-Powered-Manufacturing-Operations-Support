from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class NotificationBase(BaseModel):
    user_id: int
    incident_id: Optional[int] = None

    notification_type: Optional[str] = None
    message: Optional[str] = None
    priority: Optional[str] = None

    is_read: Optional[bool] = False


class NotificationCreate(NotificationBase):
    pass


class NotificationUpdate(BaseModel):
    notification_type: Optional[str] = None
    message: Optional[str] = None
    priority: Optional[str] = None
    is_read: Optional[bool] = None


class NotificationResponse(NotificationBase):
    notification_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)