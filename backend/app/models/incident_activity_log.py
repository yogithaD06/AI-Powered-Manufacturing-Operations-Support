from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    DateTime,
    ForeignKey
)
from sqlalchemy.sql import func

from app.core.database import Base


class IncidentActivityLog(Base):
    __tablename__ = "incident_activity_logs"

    activity_id = Column(Integer, primary_key=True, index=True)

    incident_id = Column(
        Integer,
        ForeignKey("incidents.incident_id"),
        nullable=False
    )

    ticket_id = Column(
        Integer,
        ForeignKey("tickets.ticket_id"),
        nullable=True
    )

    user_id = Column(
        Integer,
        ForeignKey("users.user_id"),
        nullable=False
    )

    action_type = Column(String(50), nullable=True)
    old_value = Column(Text, nullable=True)
    new_value = Column(Text, nullable=True)
    comments = Column(Text, nullable=True)

    created_at = Column(
        DateTime,
        server_default=func.now()
    )