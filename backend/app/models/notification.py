from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    Boolean,
    DateTime,
    ForeignKey
)
from sqlalchemy.sql import func

from app.core.database import Base


class Notification(Base):
    __tablename__ = "notifications"

    notification_id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    user_id = Column(
        Integer,
        ForeignKey("users.user_id"),
        nullable=False
    )

    incident_id = Column(
        Integer,
        ForeignKey("incidents.incident_id"),
        nullable=True
    )

    notification_type = Column(String(50), nullable=True)
    message = Column(Text, nullable=True)
    priority = Column(String(20), nullable=True)

    is_read = Column(
        Boolean,
        default=False
    )

    created_at = Column(
        DateTime,
        server_default=func.now()
    )