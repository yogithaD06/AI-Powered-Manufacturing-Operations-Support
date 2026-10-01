from sqlalchemy.orm import Session

from app.models.role import Role
from app.schemas.role import RoleCreate, RoleUpdate


def create_role(db: Session, role: RoleCreate):
    db_role = Role(
        role_name=role.role_name,
        role_description=role.role_description,
        permissions=role.permissions,
    )

    db.add(db_role)
    db.commit()
    db.refresh(db_role)

    return db_role


def get_role(db: Session, role_id: int):
    return (
        db.query(Role)
        .filter(Role.role_id == role_id)
        .first()
    )


def get_roles(db: Session, skip: int = 0, limit: int = 100):
    return (
        db.query(Role)
        .offset(skip)
        .limit(limit)
        .all()
    )


def update_role(
    db: Session,
    role_id: int,
    role: RoleUpdate
):
    db_role = get_role(db, role_id)

    if db_role is None:
        return None

    update_data = role.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(db_role, field, value)

    db.commit()
    db.refresh(db_role)

    return db_role


def delete_role(db: Session, role_id: int):
    db_role = get_role(db, role_id)

    if db_role is None:
        return None

    db.delete(db_role)
    db.commit()

    return db_role