from sqlalchemy.orm import Session

from app.models.ml_prediction import MLPrediction
from app.schemas.ml_prediction import (
    MLPredictionCreate,
    MLPredictionUpdate
)


def create_ml_prediction(
    db: Session,
    ml_prediction: MLPredictionCreate
):
    db_prediction = MLPrediction(
        incident_id=ml_prediction.incident_id,
        predicted_priority=ml_prediction.predicted_priority,
        priority_confidence=ml_prediction.priority_confidence,
        estimated_resolution_time=(
            ml_prediction.estimated_resolution_time
        ),
        probable_root_cause=ml_prediction.probable_root_cause,
        root_cause_confidence=ml_prediction.root_cause_confidence,
        recommended_team=ml_prediction.recommended_team,
        similar_incidents=ml_prediction.similar_incidents,
        recurring_pattern=ml_prediction.recurring_pattern,
        downtime_forecast=ml_prediction.downtime_forecast,
        model_version=ml_prediction.model_version
    )

    db.add(db_prediction)
    db.commit()
    db.refresh(db_prediction)

    return db_prediction


def get_ml_prediction(
    db: Session,
    prediction_id: int
):
    return (
        db.query(MLPrediction)
        .filter(
            MLPrediction.prediction_id == prediction_id
        )
        .first()
    )


def get_ml_predictions(
    db: Session,
    skip: int = 0,
    limit: int = 100
):
    return (
        db.query(MLPrediction)
        .offset(skip)
        .limit(limit)
        .all()
    )


def update_ml_prediction(
    db: Session,
    prediction_id: int,
    prediction_update: MLPredictionUpdate
):
    db_prediction = get_ml_prediction(
        db,
        prediction_id
    )

    if db_prediction is None:
        return None

    update_data = prediction_update.model_dump(
        exclude_unset=True
    )

    for key, value in update_data.items():
        setattr(db_prediction, key, value)

    db.commit()
    db.refresh(db_prediction)

    return db_prediction


def delete_ml_prediction(
    db: Session,
    prediction_id: int
):
    db_prediction = get_ml_prediction(
        db,
        prediction_id
    )

    if db_prediction is None:
        return None

    db.delete(db_prediction)
    db.commit()

    return db_prediction