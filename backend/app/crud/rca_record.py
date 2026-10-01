from sqlalchemy.orm import Session

from app.models.rca_record import RCARecord
from app.schemas.rca_record import RCARecordCreate, RCARecordUpdate


def create_rca_record(db: Session, rca_record: RCARecordCreate):
    db_rca = RCARecord(
        incident_id=rca_record.incident_id,
        investigation_notes=rca_record.investigation_notes,
        investigation_method=rca_record.investigation_method,
        evidence_observations=rca_record.evidence_observations,
        contributing_factors=rca_record.contributing_factors,
        root_cause=rca_record.root_cause,
        root_cause_category=rca_record.root_cause_category,
        corrective_action_required=rca_record.corrective_action_required,
        rca_findings=rca_record.rca_findings,
        identified_by=rca_record.identified_by,
        status=rca_record.status,
        completed_at=rca_record.completed_at,
    )

    db.add(db_rca)
    db.commit()
    db.refresh(db_rca)

    return db_rca


def get_rca_record(db: Session, rca_id: int):
    return (
        db.query(RCARecord)
        .filter(RCARecord.rca_id == rca_id)
        .first()
    )


def get_rca_records(
    db: Session,
    skip: int = 0,
    limit: int = 100
):
    return (
        db.query(RCARecord)
        .offset(skip)
        .limit(limit)
        .all()
    )


def update_rca_record(
    db: Session,
    rca_id: int,
    rca_record: RCARecordUpdate
):
    db_rca = get_rca_record(db, rca_id)

    if db_rca is None:
        return None

    update_data = rca_record.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(db_rca, field, value)

    db.commit()
    db.refresh(db_rca)

    return db_rca


def delete_rca_record(db: Session, rca_id: int):
    db_rca = get_rca_record(db, rca_id)

    if db_rca is None:
        return None

    db.delete(db_rca)
    db.commit()

    return db_rca