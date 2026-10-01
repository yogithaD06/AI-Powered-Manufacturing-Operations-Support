from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.sql import func

from app.core.database import Base


class Incident(Base):
    __tablename__ = "incidents"

    incident_id = Column(Integer, primary_key=True, index=True)

    incident_number = Column(String(30), unique=True, nullable=False)

    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)

    machine_id = Column(
        Integer,
        ForeignKey("machines.machine_id"),
        nullable=True
    )

    category_id = Column(
        Integer,
        ForeignKey("issue_categories.category_id"),
        nullable=True
    )

    reported_by = Column(
        Integer,
        ForeignKey("users.user_id"),
        nullable=True
    )

    severity = Column(String(20), nullable=True)

    production_impact = Column(Text, nullable=True)
    safety_impact = Column(Text, nullable=True)

    status = Column(String(30), default="OPEN")

    occurrence_time = Column(DateTime, nullable=False)
    reported_time = Column(DateTime, nullable=True)

    created_at = Column(
        DateTime,
        server_default=func.now()
    )

    updated_at = Column(
        DateTime,
        server_default=func.now(),
        onupdate=func.now()
    )

    closed_at = Column(DateTime, nullable=True)