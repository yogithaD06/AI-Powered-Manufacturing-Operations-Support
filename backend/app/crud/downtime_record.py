from sqlalchemy.orm import Session

from app.models.downtime_record import DowntimeRecord
from app.schemas.downtime_record import (
    DowntimeRecordCreate,
    DowntimeRecordUpdate,
)


def create_downtime_record(
    db: Session,
    downtime_record: DowntimeRecordCreate
):
    db_downtime = DowntimeRecord(
        incident_id=downtime_record.incident_id,
        machine_id=downtime_record.machine_id,
        line_id=downtime_record.line_id,
        downtime_reason=downtime_record.downtime_reason,
        downtime_category=downtime_record.downtime_category,
        start_time=downtime_record.start_time,
        end_time=downtime_record.end_time,
        duration_minutes=downtime_record.duration_minutes,
        production_units_affected=downtime_record.production_units_affected,
        production_loss=downtime_record.production_loss,
        impact_description=downtime_record.impact_description,
    )

    db.add(db_downtime)
    db.commit()
    db.refresh(db_downtime)

    return db_downtime


def get_downtime_record(db: Session, downtime_id: int):
    return (
        db.query(DowntimeRecord)
        .filter(DowntimeRecord.downtime_id == downtime_id)
        .first()
    )


def get_downtime_records(
    db: Session,
    skip: int = 0,
    limit: int = 100
):
    return (
        db.query(DowntimeRecord)
        .offset(skip)
        .limit(limit)
        .all()
    )


def update_downtime_record(
    db: Session,
    downtime_id: int,
    downtime_record: DowntimeRecordUpdate
):
    db_downtime = get_downtime_record(db, downtime_id)

    if db_downtime is None:
        return None

    update_data = downtime_record.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(db_downtime, field, value)

    db.commit()
    db.refresh(db_downtime)

    return db_downtime


def delete_downtime_record(db: Session, downtime_id: int):
    db_downtime = get_downtime_record(db, downtime_id)

    if db_downtime is None:
        return None

    db.delete(db_downtime)
    db.commit()

    return db_downtime