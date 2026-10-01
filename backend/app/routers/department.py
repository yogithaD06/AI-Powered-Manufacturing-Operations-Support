from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.crud import department as department_crud
from app.schemas.department import (
    DepartmentCreate,
    DepartmentUpdate,
    DepartmentResponse
)


router = APIRouter(
    prefix="/departments",
    tags=["Departments"]
)


@router.post(
    "/",
    response_model=DepartmentResponse
)
def create_department(
    department: DepartmentCreate,
    db: Session = Depends(get_db)
):
    return department_crud.create_department(
        db,
        department
    )


@router.get(
    "/",
    response_model=list[DepartmentResponse]
)
def read_departments(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    return department_crud.get_departments(
        db,
        skip=skip,
        limit=limit
    )


@router.get(
    "/{department_id}",
    response_model=DepartmentResponse
)
def read_department(
    department_id: int,
    db: Session = Depends(get_db)
):
    db_department = department_crud.get_department(
        db,
        department_id
    )

    if db_department is None:
        raise HTTPException(
            status_code=404,
            detail="Department not found"
        )

    return db_department


@router.put(
    "/{department_id}",
    response_model=DepartmentResponse
)
def update_department(
    department_id: int,
    department: DepartmentUpdate,
    db: Session = Depends(get_db)
):
    db_department = department_crud.update_department(
        db,
        department_id,
        department
    )

    if db_department is None:
        raise HTTPException(
            status_code=404,
            detail="Department not found"
        )

    return db_department


@router.delete(
    "/{department_id}"
)
def delete_department(
    department_id: int,
    db: Session = Depends(get_db)
):
    db_department = department_crud.delete_department(
        db,
        department_id
    )

    if db_department is None:
        raise HTTPException(
            status_code=404,
            detail="Department not found"
        )

    return {
        "message": "Department deleted successfully"
    }