from sqlalchemy.orm import Session

from app.models.department import Department
from app.schemas.department import DepartmentCreate, DepartmentUpdate


def create_department(db: Session, department: DepartmentCreate):
    db_department = Department(
        department_name=department.department_name,
        description=department.description,
        location=department.location,
        status=department.status,
    )

    db.add(db_department)
    db.commit()
    db.refresh(db_department)

    return db_department


def get_department(db: Session, department_id: int):
    return (
        db.query(Department)
        .filter(Department.department_id == department_id)
        .first()
    )


def get_departments(
    db: Session,
    skip: int = 0,
    limit: int = 100
):
    return (
        db.query(Department)
        .offset(skip)
        .limit(limit)
        .all()
    )


def update_department(
    db: Session,
    department_id: int,
    department: DepartmentUpdate
):
    db_department = get_department(db, department_id)

    if db_department is None:
        return None

    update_data = department.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(db_department, field, value)

    db.commit()
    db.refresh(db_department)

    return db_department


def delete_department(db: Session, department_id: int):
    db_department = get_department(db, department_id)

    if db_department is None:
        return None

    db.delete(db_department)
    db.commit()

    return db_department