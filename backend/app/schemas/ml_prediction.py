from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, ConfigDict


class MLPredictionBase(BaseModel):
    incident_id: int

    predicted_priority: Optional[str] = None
    priority_confidence: Optional[float] = None

    estimated_resolution_time: Optional[float] = None

    probable_root_cause: Optional[str] = None
    root_cause_confidence: Optional[float] = None

    recommended_team: Optional[str] = None

    similar_incidents: Optional[Any] = None
    recurring_pattern: Optional[str] = None

    downtime_forecast: Optional[float] = None

    model_version: Optional[str] = None


class MLPredictionCreate(MLPredictionBase):
    pass


class MLPredictionUpdate(BaseModel):
    predicted_priority: Optional[str] = None
    priority_confidence: Optional[float] = None

    estimated_resolution_time: Optional[float] = None

    probable_root_cause: Optional[str] = None
    root_cause_confidence: Optional[float] = None

    recommended_team: Optional[str] = None

    similar_incidents: Optional[Any] = None
    recurring_pattern: Optional[str] = None

    downtime_forecast: Optional[float] = None

    model_version: Optional[str] = None


class MLPredictionResponse(MLPredictionBase):
    prediction_id: int
    predicted_at: datetime

    model_config = ConfigDict(from_attributes=True)