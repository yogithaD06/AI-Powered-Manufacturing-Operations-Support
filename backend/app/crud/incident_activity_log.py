from sqlalchemy.orm import Session

from app.models.incident_activity_log import IncidentActivityLog
from app.schemas.incident_activity_log import (
    IncidentActivityLogCreate,
    IncidentActivityLogUpdate
)


def create_incident_activity_log(
    db: Session,
    activity_log: IncidentActivityLogCreate
):
    db_activity = IncidentActivityLog(
        incident_id=activity_log.incident_id,
        ticket_id=activity_log.ticket_id,
        user_id=activity_log.user_id,
        action_type=activity_log.action_type,
        old_value=activity_log.old_value,
        new_value=activity_log.new_value,
        comments=activity_log.comments
    )

    db.add(db_activity)
    db.commit()
    db.refresh(db_activity)

    return db_activity


def get_incident_activity_log(
    db: Session,
    activity_id: int
):
    return (
        db.query(IncidentActivityLog)
        .filter(
            IncidentActivityLog.activity_id == activity_id
        )
        .first()
    )


def get_incident_activity_logs(
    db: Session,
    skip: int = 0,
    limit: int = 100
):
    return (
        db.query(IncidentActivityLog)
        .offset(skip)
        .limit(limit)
        .all()
    )


def update_incident_activity_log(
    db: Session,
    activity_id: int,
    activity_update: IncidentActivityLogUpdate
):
    db_activity = get_incident_activity_log(
        db,
        activity_id
    )

    if db_activity is None:
        return None

    update_data = activity_update.model_dump(
        exclude_unset=True
    )

    for key, value in update_data.items():
        setattr(db_activity, key, value)

    db.commit()
    db.refresh(db_activity)

    return db_activity


def delete_incident_activity_log(
    db: Session,
    activity_id: int
):
    db_activity = get_incident_activity_log(
        db,
        activity_id
    )

    if db_activity is None:
        return None

    db.delete(db_activity)
    db.commit()

    return db_activity