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


class ResolutionRecord(Base):
    __tablename__ = "resolution_records"

    resolution_id = Column(Integer, primary_key=True, index=True)

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

    resolution_description = Column(Text, nullable=True)
    resolution_method = Column(String(100), nullable=True)
    parts_resources_used = Column(Text, nullable=True)
    resolution_notes = Column(Text, nullable=True)

    resolved_by = Column(
        Integer,
        ForeignKey("users.user_id"),
        nullable=True
    )

    resolved_at = Column(DateTime, nullable=True)

    verification_result = Column(Text, nullable=True)
    verification_status = Column(String(30), nullable=True)

    verified_by = Column(
        Integer,
        ForeignKey("users.user_id"),
        nullable=True
    )

    verification_date = Column(DateTime, nullable=True)

    closure_notes = Column(Text, nullable=True)
    closure_status = Column(String(30), nullable=True)

    created_at = Column(
        DateTime,
        server_default=func.now()
    )