from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.crud import incident_activity_log as incident_activity_log_crud
from app.schemas.incident_activity_log import (
    IncidentActivityLogCreate,
    IncidentActivityLogUpdate,
    IncidentActivityLogResponse
)


router = APIRouter(
    prefix="/incident-activity-logs",
    tags=["Incident Activity Logs"]
)


@router.post(
    "/",
    response_model=IncidentActivityLogResponse
)
def create_incident_activity_log(
    activity_log: IncidentActivityLogCreate,
    db: Session = Depends(get_db)
):
    return incident_activity_log_crud.create_incident_activity_log(
        db,
        activity_log
    )


@router.get(
    "/",
    response_model=list[IncidentActivityLogResponse]
)
def read_incident_activity_logs(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    return incident_activity_log_crud.get_incident_activity_logs(
        db,
        skip=skip,
        limit=limit
    )


@router.get(
    "/{activity_id}",
    response_model=IncidentActivityLogResponse
)
def read_incident_activity_log(
    activity_id: int,
    db: Session = Depends(get_db)
):
    db_activity = incident_activity_log_crud.get_incident_activity_log(
        db,
        activity_id
    )

    if db_activity is None:
        raise HTTPException(
            status_code=404,
            detail="Incident activity log not found"
        )

    return db_activity


@router.put(
    "/{activity_id}",
    response_model=IncidentActivityLogResponse
)
def update_incident_activity_log(
    activity_id: int,
    activity_update: IncidentActivityLogUpdate,
    db: Session = Depends(get_db)
):
    db_activity = incident_activity_log_crud.update_incident_activity_log(
        db,
        activity_id,
        activity_update
    )

    if db_activity is None:
        raise HTTPException(
            status_code=404,
            detail="Incident activity log not found"
        )

    return db_activity


@router.delete(
    "/{activity_id}"
)
def delete_incident_activity_log(
    activity_id: int,
    db: Session = Depends(get_db)
):
    db_activity = incident_activity_log_crud.delete_incident_activity_log(
        db,
        activity_id
    )

    if db_activity is None:
        raise HTTPException(
            status_code=404,
            detail="Incident activity log not found"
        )

    return {
        "message": "Incident activity log deleted successfully"
    }