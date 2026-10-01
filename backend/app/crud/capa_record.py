from sqlalchemy.orm import Session

from app.models.capa_record import CAPARecord
from app.schemas.capa_record import CAPARecordCreate, CAPARecordUpdate


def create_capa_record(
    db: Session,
    capa_record: CAPARecordCreate
):
    db_capa = CAPARecord(
        incident_id=capa_record.incident_id,
        action_type=capa_record.action_type,
        action_description=capa_record.action_description,
        assigned_to=capa_record.assigned_to,
        target_date=capa_record.target_date,
        completion_date=capa_record.completion_date,
        status=capa_record.status,
        verification_notes=capa_record.verification_notes,
        verification_result=capa_record.verification_result,
        verified_by=capa_record.verified_by,
        verification_date=capa_record.verification_date,
        effectiveness_status=capa_record.effectiveness_status
    )

    db.add(db_capa)
    db.commit()
    db.refresh(db_capa)

    return db_capa


def get_capa_record(
    db: Session,
    capa_id: int
):
    return (
        db.query(CAPARecord)
        .filter(CAPARecord.capa_id == capa_id)
        .first()
    )


def get_capa_records(
    db: Session,
    skip: int = 0,
    limit: int = 100
):
    return (
        db.query(CAPARecord)
        .offset(skip)
        .limit(limit)
        .all()
    )


def update_capa_record(
    db: Session,
    capa_id: int,
    capa_update: CAPARecordUpdate
):
    db_capa = get_capa_record(db, capa_id)

    if db_capa is None:
        return None

    update_data = capa_update.model_dump(
        exclude_unset=True
    )

    for key, value in update_data.items():
        setattr(db_capa, key, value)

    db.commit()
    db.refresh(db_capa)

    return db_capa


def delete_capa_record(
    db: Session,
    capa_id: int
):
    db_capa = get_capa_record(db, capa_id)

    if db_capa is None:
        return None

    db.delete(db_capa)
    db.commit()

    return db_capa