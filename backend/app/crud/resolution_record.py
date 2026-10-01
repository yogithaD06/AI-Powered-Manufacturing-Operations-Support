from sqlalchemy.orm import Session

from app.models.resolution_record import ResolutionRecord
from app.schemas.resolution_record import (
    ResolutionRecordCreate,
    ResolutionRecordUpdate
)


def create_resolution_record(
    db: Session,
    resolution_record: ResolutionRecordCreate
):
    db_resolution = ResolutionRecord(
        incident_id=resolution_record.incident_id,
        ticket_id=resolution_record.ticket_id,
        resolution_description=resolution_record.resolution_description,
        resolution_method=resolution_record.resolution_method,
        parts_resources_used=resolution_record.parts_resources_used,
        resolution_notes=resolution_record.resolution_notes,
        resolved_by=resolution_record.resolved_by,
        resolved_at=resolution_record.resolved_at,
        verification_result=resolution_record.verification_result,
        verification_status=resolution_record.verification_status,
        verified_by=resolution_record.verified_by,
        verification_date=resolution_record.verification_date,
        closure_notes=resolution_record.closure_notes,
        closure_status=resolution_record.closure_status
    )

    db.add(db_resolution)
    db.commit()
    db.refresh(db_resolution)

    return db_resolution


def get_resolution_record(
    db: Session,
    resolution_id: int
):
    return (
        db.query(ResolutionRecord)
        .filter(
            ResolutionRecord.resolution_id == resolution_id
        )
        .first()
    )


def get_resolution_records(
    db: Session,
    skip: int = 0,
    limit: int = 100
):
    return (
        db.query(ResolutionRecord)
        .offset(skip)
        .limit(limit)
        .all()
    )


def update_resolution_record(
    db: Session,
    resolution_id: int,
    resolution_update: ResolutionRecordUpdate
):
    db_resolution = get_resolution_record(
        db,
        resolution_id
    )

    if db_resolution is None:
        return None

    update_data = resolution_update.model_dump(
        exclude_unset=True
    )

    for key, value in update_data.items():
        setattr(db_resolution, key, value)

    db.commit()
    db.refresh(db_resolution)

    return db_resolution


def delete_resolution_record(
    db: Session,
    resolution_id: int
):
    db_resolution = get_resolution_record(
        db,
        resolution_id
    )

    if db_resolution is None:
        return None

    db.delete(db_resolution)
    db.commit()

    return db_resolution