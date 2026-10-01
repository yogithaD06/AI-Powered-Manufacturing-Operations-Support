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


class RCARecord(Base):
    __tablename__ = "rca_records"

    rca_id = Column(Integer, primary_key=True, index=True)

    incident_id = Column(
        Integer,
        ForeignKey("incidents.incident_id"),
        nullable=False
    )

    investigation_notes = Column(Text, nullable=True)
    investigation_method = Column(String(100), nullable=True)
    evidence_observations = Column(Text, nullable=True)
    contributing_factors = Column(Text, nullable=True)

    root_cause = Column(Text, nullable=True)
    root_cause_category = Column(String(100), nullable=True)
    corrective_action_required = Column(Text, nullable=True)
    rca_findings = Column(Text, nullable=True)

    identified_by = Column(
        Integer,
        ForeignKey("users.user_id"),
        nullable=True
    )

    status = Column(String(30), default="OPEN")

    created_at = Column(
        DateTime,
        server_default=func.now()
    )

    completed_at = Column(DateTime, nullable=True)