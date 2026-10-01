from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.crud import incident as incident_crud
from app.schemas.incident import (
    IncidentCreate,
    IncidentUpdate,
    IncidentResponse,
)


router = APIRouter(
    prefix="/incidents",
    tags=["Incidents"]
)


def format_incident_response(db_incident):
    return {
        "incident_id": db_incident.incident_id,
        "incident_title": db_incident.title,
        "incident_description": db_incident.description,
        "issue_category_id": db_incident.category_id,
        "machine_id": db_incident.machine_id,
        "reported_by": db_incident.reported_by,
        "priority": db_incident.severity,
        "status": db_incident.status,
        "occurrence_time": db_incident.occurrence_time,
        "reported_time": db_incident.reported_time,
        "production_impact": db_incident.production_impact,
        "safety_impact": db_incident.safety_impact,
        "created_at": db_incident.created_at,
        "updated_at": db_incident.updated_at,
    }


@router.post("/", response_model=IncidentResponse)
def create_incident(
    incident: IncidentCreate,
    db: Session = Depends(get_db)
):
    db_incident = incident_crud.create_incident(db, incident)

    return format_incident_response(db_incident)


@router.get("/", response_model=list[IncidentResponse])
def read_incidents(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    db_incidents = incident_crud.get_incidents(
        db,
        skip=skip,
        limit=limit
    )

    return [
        format_incident_response(incident)
        for incident in db_incidents
    ]


@router.get("/{incident_id}", response_model=IncidentResponse)
def read_incident(
    incident_id: int,
    db: Session = Depends(get_db)
):
    db_incident = incident_crud.get_incident(db, incident_id)

    if db_incident is None:
        raise HTTPException(
            status_code=404,
            detail="Incident not found"
        )

    return format_incident_response(db_incident)


@router.put("/{incident_id}", response_model=IncidentResponse)
def update_incident(
    incident_id: int,
    incident: IncidentUpdate,
    db: Session = Depends(get_db)
):
    db_incident = incident_crud.update_incident(
        db,
        incident_id,
        incident
    )

    if db_incident is None:
        raise HTTPException(
            status_code=404,
            detail="Incident not found"
        )

    return format_incident_response(db_incident)


@router.delete("/{incident_id}")
def delete_incident(
    incident_id: int,
    db: Session = Depends(get_db)
):
    db_incident = incident_crud.delete_incident(
        db,
        incident_id
    )

    if db_incident is None:
        raise HTTPException(
            status_code=404,
            detail="Incident not found"
        )

    return {
        "message": "Incident deleted successfully"
    }