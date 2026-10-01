from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.crud import ml_prediction as ml_prediction_crud
from app.schemas.ml_prediction import (
    MLPredictionCreate,
    MLPredictionUpdate,
    MLPredictionResponse
)


router = APIRouter(
    prefix="/ml-predictions",
    tags=["ML Predictions"]
)


@router.post(
    "/",
    response_model=MLPredictionResponse
)
def create_ml_prediction(
    ml_prediction: MLPredictionCreate,
    db: Session = Depends(get_db)
):
    return ml_prediction_crud.create_ml_prediction(
        db,
        ml_prediction
    )


@router.get(
    "/",
    response_model=list[MLPredictionResponse]
)
def read_ml_predictions(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    return ml_prediction_crud.get_ml_predictions(
        db,
        skip=skip,
        limit=limit
    )


@router.get(
    "/{prediction_id}",
    response_model=MLPredictionResponse
)
def read_ml_prediction(
    prediction_id: int,
    db: Session = Depends(get_db)
):
    db_prediction = ml_prediction_crud.get_ml_prediction(
        db,
        prediction_id
    )

    if db_prediction is None:
        raise HTTPException(
            status_code=404,
            detail="ML prediction not found"
        )

    return db_prediction


@router.put(
    "/{prediction_id}",
    response_model=MLPredictionResponse
)
def update_ml_prediction(
    prediction_id: int,
    prediction_update: MLPredictionUpdate,
    db: Session = Depends(get_db)
):
    db_prediction = ml_prediction_crud.update_ml_prediction(
        db,
        prediction_id,
        prediction_update
    )

    if db_prediction is None:
        raise HTTPException(
            status_code=404,
            detail="ML prediction not found"
        )

    return db_prediction


@router.delete(
    "/{prediction_id}"
)
def delete_ml_prediction(
    prediction_id: int,
    db: Session = Depends(get_db)
):
    db_prediction = ml_prediction_crud.delete_ml_prediction(
        db,
        prediction_id
    )

    if db_prediction is None:
        raise HTTPException(
            status_code=404,
            detail="ML prediction not found"
        )

    return {
        "message": "ML prediction deleted successfully"
    }