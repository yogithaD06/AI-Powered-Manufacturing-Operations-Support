from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.crud import user as user_crud
from app.schemas.user import (
    UserCreate,
    UserUpdate,
    UserResponse
)


router = APIRouter(
    prefix="/users",
    tags=["Users"]
)


def format_user_response(db_user):
    return {
        "user_id": db_user.user_id,
        "employee_id": db_user.employee_id,
        "full_name": db_user.name,
        "email": db_user.email,
        "role_id": db_user.role_id,
        "department_id": db_user.department_id,
        "status": db_user.account_status,
        "created_at": db_user.created_at,
    }


@router.post(
    "/",
    response_model=UserResponse
)
def create_user(
    user: UserCreate,
    db: Session = Depends(get_db)
):
    db_user = user_crud.create_user(
        db,
        user
    )

    return format_user_response(db_user)


@router.get(
    "/",
    response_model=list[UserResponse]
)
def read_users(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    db_users = user_crud.get_users(
        db,
        skip=skip,
        limit=limit
    )

    return [
        format_user_response(user)
        for user in db_users
    ]


@router.get(
    "/{user_id}",
    response_model=UserResponse
)
def read_user(
    user_id: int,
    db: Session = Depends(get_db)
):
    db_user = user_crud.get_user(
        db,
        user_id
    )

    if db_user is None:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    return format_user_response(db_user)


@router.put(
    "/{user_id}",
    response_model=UserResponse
)
def update_user(
    user_id: int,
    user: UserUpdate,
    db: Session = Depends(get_db)
):
    db_user = user_crud.update_user(
        db,
        user_id,
        user
    )

    if db_user is None:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    return format_user_response(db_user)


@router.delete(
    "/{user_id}"
)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db)
):
    db_user = user_crud.delete_user(
        db,
        user_id
    )

    if db_user is None:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    return {
        "message": "User deleted successfully"
    }