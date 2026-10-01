from sqlalchemy.orm import Session

from app.models.production_line import ProductionLine
from app.schemas.production_line import (
    ProductionLineCreate,
    ProductionLineUpdate,
)


def create_production_line(
    db: Session,
    production_line: ProductionLineCreate
):
    db_production_line = ProductionLine(
        line_name=production_line.line_name,
        department_id=production_line.department_id,
        location=production_line.location,
        status=production_line.status,
    )

    db.add(db_production_line)
    db.commit()
    db.refresh(db_production_line)

    return db_production_line


def get_production_line(db: Session, line_id: int):
    return (
        db.query(ProductionLine)
        .filter(ProductionLine.line_id == line_id)
        .first()
    )


def get_production_lines(
    db: Session,
    skip: int = 0,
    limit: int = 100
):
    return (
        db.query(ProductionLine)
        .offset(skip)
        .limit(limit)
        .all()
    )


def update_production_line(
    db: Session,
    line_id: int,
    production_line: ProductionLineUpdate
):
    db_production_line = get_production_line(db, line_id)

    if db_production_line is None:
        return None

    update_data = production_line.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(db_production_line, field, value)

    db.commit()
    db.refresh(db_production_line)

    return db_production_line


def delete_production_line(db: Session, line_id: int):
    db_production_line = get_production_line(db, line_id)

    if db_production_line is None:
        return None

    db.delete(db_production_line)
    db.commit()

    return db_production_line