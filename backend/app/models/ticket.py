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


class Ticket(Base):
    __tablename__ = "tickets"

    ticket_id = Column(Integer, primary_key=True, index=True)

    ticket_number = Column(
        String(30),
        unique=True,
        nullable=False
    )

    incident_id = Column(
        Integer,
        ForeignKey("incidents.incident_id"),
        nullable=False
    )

    assigned_department_id = Column(
        Integer,
        ForeignKey("departments.department_id"),
        nullable=True
    )

    assigned_team = Column(String(100), nullable=True)

    assigned_engineer_id = Column(
        Integer,
        ForeignKey("users.user_id"),
        nullable=True
    )

    escalation_level = Column(String(30), nullable=True)
    due_date = Column(DateTime, nullable=True)
    status = Column(String(30), default="OPEN")

    investigation_notes = Column(Text, nullable=True)
    temporary_fix = Column(Text, nullable=True)
    resolution_notes = Column(Text, nullable=True)

    acknowledged_at = Column(DateTime, nullable=True)
    assigned_at = Column(DateTime, nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    closed_at = Column(DateTime, nullable=True)

    created_at = Column(
        DateTime,
        server_default=func.now()
    )