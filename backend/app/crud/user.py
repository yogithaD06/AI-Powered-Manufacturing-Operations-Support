from sqlalchemy.orm import Session

from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate


def create_user(db: Session, user: UserCreate):
    db_user = User(
        employee_id=user.employee_id,
        name=user.full_name,
        email=user.email,
        password_hash=user.password,
        role_id=user.role_id,
        department_id=user.department_id,
        account_status=user.status,
    )

    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    return db_user


def get_user(db: Session, user_id: int):
    return (
        db.query(User)
        .filter(User.user_id == user_id)
        .first()
    )


def get_users(
    db: Session,
    skip: int = 0,
    limit: int = 100
):
    return (
        db.query(User)
        .offset(skip)
        .limit(limit)
        .all()
    )


def update_user(
    db: Session,
    user_id: int,
    user: UserUpdate
):
    db_user = get_user(db, user_id)

    if db_user is None:
        return None

    update_data = user.model_dump(exclude_unset=True)

    # Map schema fields to database fields
    if "full_name" in update_data:
        db_user.name = update_data.pop("full_name")

    if "status" in update_data:
        db_user.account_status = update_data.pop("status")

    if "password" in update_data:
        db_user.password_hash = update_data.pop("password")

    for field, value in update_data.items():
        setattr(db_user, field, value)

    db.commit()
    db.refresh(db_user)

    return db_user


def delete_user(db: Session, user_id: int):
    db_user = get_user(db, user_id)

    if db_user is None:
        return None

    db.delete(db_user)
    db.commit()

    return db_user