from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    Date,
    DateTime,
    ForeignKey
)
from sqlalchemy.sql import func

from app.core.database import Base


class CAPARecord(Base):
    __tablename__ = "capa_records"

    capa_id = Column(Integer, primary_key=True, index=True)

    incident_id = Column(
        Integer,
        ForeignKey("incidents.incident_id"),
        nullable=False
    )

    action_type = Column(String(30), nullable=True)
    action_description = Column(Text, nullable=True)

    assigned_to = Column(
        Integer,
        ForeignKey("users.user_id"),
        nullable=True
    )

    target_date = Column(Date, nullable=True)
    completion_date = Column(Date, nullable=True)

    status = Column(String(30), default="OPEN")

    verification_notes = Column(Text, nullable=True)
    verification_result = Column(Text, nullable=True)

    verified_by = Column(
        Integer,
        ForeignKey("users.user_id"),
        nullable=True
    )

    verification_date = Column(DateTime, nullable=True)
    effectiveness_status = Column(String(30), nullable=True)

    created_at = Column(
        DateTime,
        server_default=func.now()
    )