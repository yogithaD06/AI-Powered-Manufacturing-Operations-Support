from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.crud import role as role_crud
from app.schemas.role import (
    RoleCreate,
    RoleUpdate,
    RoleResponse
)

router = APIRouter(
    prefix="/roles",
    tags=["Roles"]
)


@router.post(
    "/",
    response_model=RoleResponse
)
def create_role(
    role: RoleCreate,
    db: Session = Depends(get_db)
):
    return role_crud.create_role(db, role)


@router.get(
    "/",
    response_model=list[RoleResponse]
)
def read_roles(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    return role_crud.get_roles(
        db,
        skip=skip,
        limit=limit
    )


@router.get(
    "/{role_id}",
    response_model=RoleResponse
)
def read_role(
    role_id: int,
    db: Session = Depends(get_db)
):
    db_role = role_crud.get_role(db, role_id)

    if db_role is None:
        raise HTTPException(
            status_code=404,
            detail="Role not found"
        )

    return db_role


@router.put(
    "/{role_id}",
    response_model=RoleResponse
)
def update_role(
    role_id: int,
    role: RoleUpdate,
    db: Session = Depends(get_db)
):
    db_role = role_crud.update_role(
        db,
        role_id,
        role
    )

    if db_role is None:
        raise HTTPException(
            status_code=404,
            detail="Role not found"
        )

    return db_role


@router.delete(
    "/{role_id}"
)
def delete_role(
    role_id: int,
    db: Session = Depends(get_db)
):
    db_role = role_crud.delete_role(db, role_id)

    if db_role is None:
        raise HTTPException(
            status_code=404,
            detail="Role not found"
        )

    return {
        "message": "Role deleted successfully"
    }