from uuid import uuid4

from sqlalchemy.orm import Session

from app.models.incident import Incident
from app.schemas.incident import IncidentCreate, IncidentUpdate


def create_incident(db: Session, incident: IncidentCreate):
    # Generate a unique incident number
    timestamp = (
        incident.reported_time.strftime("%Y%m%d%H%M%S")
        if incident.reported_time
        else "UNKNOWN"
    )

    incident_number = f"INC-{timestamp}-{uuid4().hex[:6].upper()}"

    db_incident = Incident(
        incident_number=incident_number,
        title=incident.incident_title,
        description=incident.incident_description,
        machine_id=incident.machine_id,
        category_id=incident.issue_category_id,
        reported_by=incident.reported_by,
        severity=incident.priority,
        production_impact=incident.production_impact,
        safety_impact=incident.safety_impact,
        status=incident.status,
        occurrence_time=incident.occurrence_time,
        reported_time=incident.reported_time,
    )

    db.add(db_incident)
    db.commit()
    db.refresh(db_incident)

    return db_incident


def get_incident(db: Session, incident_id: int):
    return (
        db.query(Incident)
        .filter(Incident.incident_id == incident_id)
        .first()
    )


def get_incidents(db: Session, skip: int = 0, limit: int = 100):
    return (
        db.query(Incident)
        .offset(skip)
        .limit(limit)
        .all()
    )


def update_incident(
    db: Session,
    incident_id: int,
    incident: IncidentUpdate
):
    db_incident = get_incident(db, incident_id)

    if db_incident is None:
        return None

    update_data = incident.model_dump(exclude_unset=True)

    # Map Swagger/API field names to database model field names
    field_mapping = {
        "incident_title": "title",
        "incident_description": "description",
        "issue_category_id": "category_id",
        "priority": "severity",
    }

    for field, value in update_data.items():
        db_field = field_mapping.get(field, field)
        setattr(db_incident, db_field, value)

    db.commit()
    db.refresh(db_incident)

    return db_incident


def delete_incident(db: Session, incident_id: int):
    db_incident = get_incident(db, incident_id)

    if db_incident is None:
        return None

    db.delete(db_incident)
    db.commit()

    return db_incident