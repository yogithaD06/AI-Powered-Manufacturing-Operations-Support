from sqlalchemy.orm import Session

from app.models.issue_category import IssueCategory
from app.schemas.issue_category import (
    IssueCategoryCreate,
    IssueCategoryUpdate,
)


def create_issue_category(
    db: Session,
    category: IssueCategoryCreate
):
    db_category = IssueCategory(
        category_name=category.category_name,
        subcategory_name=category.subcategory_name,
        description=category.description,
        severity_level=category.severity_level,
        status=category.status,
    )

    db.add(db_category)
    db.commit()
    db.refresh(db_category)

    return db_category


def get_issue_category(db: Session, category_id: int):
    return (
        db.query(IssueCategory)
        .filter(IssueCategory.category_id == category_id)
        .first()
    )


def get_issue_categories(
    db: Session,
    skip: int = 0,
    limit: int = 100
):
    return (
        db.query(IssueCategory)
        .offset(skip)
        .limit(limit)
        .all()
    )


def update_issue_category(
    db: Session,
    category_id: int,
    category: IssueCategoryUpdate
):
    db_category = get_issue_category(db, category_id)

    if db_category is None:
        return None

    update_data = category.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(db_category, field, value)

    db.commit()
    db.refresh(db_category)

    return db_category


def delete_issue_category(db: Session, category_id: int):
    db_category = get_issue_category(db, category_id)

    if db_category is None:
        return None

    db.delete(db_category)
    db.commit()

    return db_category