from sqlalchemy.orm import Session

from app.models.notification import Notification
from app.schemas.notification import (
    NotificationCreate,
    NotificationUpdate
)


def create_notification(
    db: Session,
    notification: NotificationCreate
):
    db_notification = Notification(
        user_id=notification.user_id,
        incident_id=notification.incident_id,
        notification_type=notification.notification_type,
        message=notification.message,
        priority=notification.priority,
        is_read=notification.is_read
    )

    db.add(db_notification)
    db.commit()
    db.refresh(db_notification)

    return db_notification


def get_notification(
    db: Session,
    notification_id: int
):
    return (
        db.query(Notification)
        .filter(
            Notification.notification_id == notification_id
        )
        .first()
    )


def get_notifications(
    db: Session,
    skip: int = 0,
    limit: int = 100
):
    return (
        db.query(Notification)
        .offset(skip)
        .limit(limit)
        .all()
    )


def update_notification(
    db: Session,
    notification_id: int,
    notification_update: NotificationUpdate
):
    db_notification = get_notification(
        db,
        notification_id
    )

    if db_notification is None:
        return None

    update_data = notification_update.model_dump(
        exclude_unset=True
    )

    for key, value in update_data.items():
        setattr(db_notification, key, value)

    db.commit()
    db.refresh(db_notification)

    return db_notification


def delete_notification(
    db: Session,
    notification_id: int
):
    db_notification = get_notification(
        db,
        notification_id
    )

    if db_notification is None:
        return None

    db.delete(db_notification)
    db.commit()

    return db_notification