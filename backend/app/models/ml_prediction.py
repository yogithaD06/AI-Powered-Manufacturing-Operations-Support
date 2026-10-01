from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    DateTime,
    Numeric,
    JSON,
    ForeignKey
)
from sqlalchemy.sql import func

from app.core.database import Base


class MLPrediction(Base):
    __tablename__ = "ml_predictions"

    prediction_id = Column(Integer, primary_key=True, index=True)

    incident_id = Column(
        Integer,
        ForeignKey("incidents.incident_id"),
        nullable=False
    )

    predicted_priority = Column(String(20), nullable=True)
    priority_confidence = Column(Numeric, nullable=True)

    estimated_resolution_time = Column(Numeric, nullable=True)

    probable_root_cause = Column(Text, nullable=True)
    root_cause_confidence = Column(Numeric, nullable=True)

    recommended_team = Column(String(100), nullable=True)

    similar_incidents = Column(JSON, nullable=True)
    recurring_pattern = Column(Text, nullable=True)

    downtime_forecast = Column(Numeric, nullable=True)

    model_version = Column(String(50), nullable=True)

    predicted_at = Column(
        DateTime,
        server_default=func.now()
    )