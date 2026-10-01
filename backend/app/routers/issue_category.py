from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.crud import issue_category as issue_category_crud
from app.schemas.issue_category import (
    IssueCategoryCreate,
    IssueCategoryUpdate,
    IssueCategoryResponse
)


router = APIRouter(
    prefix="/issue-categories",
    tags=["Issue Categories"]
)


@router.post(
    "/",
    response_model=IssueCategoryResponse
)
def create_issue_category(
    issue_category: IssueCategoryCreate,
    db: Session = Depends(get_db)
):
    return issue_category_crud.create_issue_category(
        db,
        issue_category
    )


@router.get(
    "/",
    response_model=list[IssueCategoryResponse]
)
def read_issue_categories(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    return issue_category_crud.get_issue_categories(
        db,
        skip=skip,
        limit=limit
    )


@router.get(
    "/{category_id}",
    response_model=IssueCategoryResponse
)
def read_issue_category(
    category_id: int,
    db: Session = Depends(get_db)
):
    db_category = issue_category_crud.get_issue_category(
        db,
        category_id
    )

    if db_category is None:
        raise HTTPException(
            status_code=404,
            detail="Issue category not found"
        )

    return db_category


@router.put(
    "/{category_id}",
    response_model=IssueCategoryResponse
)
def update_issue_category(
    category_id: int,
    issue_category: IssueCategoryUpdate,
    db: Session = Depends(get_db)
):
    db_category = issue_category_crud.update_issue_category(
        db,
        category_id,
        issue_category
    )

    if db_category is None:
        raise HTTPException(
            status_code=404,
            detail="Issue category not found"
        )

    return db_category


@router.delete(
    "/{category_id}"
)
def delete_issue_category(
    category_id: int,
    db: Session = Depends(get_db)
):
    db_category = issue_category_crud.delete_issue_category(
        db,
        category_id
    )

    if db_category is None:
        raise HTTPException(
            status_code=404,
            detail="Issue category not found"
        )

    return {
        "message": "Issue category deleted successfully"
    }