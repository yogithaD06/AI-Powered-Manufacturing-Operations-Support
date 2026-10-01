from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    DateTime,
    Numeric,
    ForeignKey
)
from sqlalchemy.sql import func

from app.core.database import Base


class DowntimeRecord(Base):
    __tablename__ = "downtime_records"

    downtime_id = Column(Integer, primary_key=True, index=True)

    incident_id = Column(
        Integer,
        ForeignKey("incidents.incident_id"),
        nullable=False
    )

    machine_id = Column(
        Integer,
        ForeignKey("machines.machine_id"),
        nullable=False
    )

    line_id = Column(
        Integer,
        ForeignKey("production_lines.line_id"),
        nullable=False
    )

    downtime_reason = Column(String(200), nullable=True)
    downtime_category = Column(String(100), nullable=True)

    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=True)

    duration_minutes = Column(Numeric, nullable=True)
    production_units_affected = Column(Integer, nullable=True)
    production_loss = Column(Numeric, nullable=True)

    impact_description = Column(Text, nullable=True)

    created_at = Column(
        DateTime,
        server_default=func.now()
    )