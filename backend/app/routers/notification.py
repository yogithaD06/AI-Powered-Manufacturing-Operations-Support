from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.crud import notification as notification_crud
from app.schemas.notification import (
    NotificationCreate,
    NotificationUpdate,
    NotificationResponse
)


router = APIRouter(
    prefix="/notifications",
    tags=["Notifications"]
)


@router.post(
    "/",
    response_model=NotificationResponse
)
def create_notification(
    notification: NotificationCreate,
    db: Session = Depends(get_db)
):
    return notification_crud.create_notification(
        db,
        notification
    )


@router.get(
    "/",
    response_model=list[NotificationResponse]
)
def read_notifications(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    return notification_crud.get_notifications(
        db,
        skip=skip,
        limit=limit
    )


@router.get(
    "/{notification_id}",
    response_model=NotificationResponse
)
def read_notification(
    notification_id: int,
    db: Session = Depends(get_db)
):
    db_notification = notification_crud.get_notification(
        db,
        notification_id
    )

    if db_notification is None:
        raise HTTPException(
            status_code=404,
            detail="Notification not found"
        )

    return db_notification


@router.put(
    "/{notification_id}",
    response_model=NotificationResponse
)
def update_notification(
    notification_id: int,
    notification_update: NotificationUpdate,
    db: Session = Depends(get_db)
):
    db_notification = notification_crud.update_notification(
        db,
        notification_id,
        notification_update
    )

    if db_notification is None:
        raise HTTPException(
            status_code=404,
            detail="Notification not found"
        )

    return db_notification


@router.delete(
    "/{notification_id}"
)
def delete_notification(
    notification_id: int,
    db: Session = Depends(get_db)
):
    db_notification = notification_crud.delete_notification(
        db,
        notification_id
    )

    if db_notification is None:
        raise HTTPException(
            status_code=404,
            detail="Notification not found"
        )

    return {
        "message": "Notification deleted successfully"
    }