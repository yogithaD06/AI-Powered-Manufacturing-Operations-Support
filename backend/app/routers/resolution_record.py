from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.crud import resolution_record as resolution_record_crud
from app.schemas.resolution_record import (
    ResolutionRecordCreate,
    ResolutionRecordUpdate,
    ResolutionRecordResponse
)


router = APIRouter(
    prefix="/resolution-records",
    tags=["Resolution Records"]
)


@router.post(
    "/",
    response_model=ResolutionRecordResponse
)
def create_resolution_record(
    resolution_record: ResolutionRecordCreate,
    db: Session = Depends(get_db)
):
    return resolution_record_crud.create_resolution_record(
        db,
        resolution_record
    )


@router.get(
    "/",
    response_model=list[ResolutionRecordResponse]
)
def read_resolution_records(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    return resolution_record_crud.get_resolution_records(
        db,
        skip=skip,
        limit=limit
    )


@router.get(
    "/{resolution_id}",
    response_model=ResolutionRecordResponse
)
def read_resolution_record(
    resolution_id: int,
    db: Session = Depends(get_db)
):
    db_resolution = resolution_record_crud.get_resolution_record(
        db,
        resolution_id
    )

    if db_resolution is None:
        raise HTTPException(
            status_code=404,
            detail="Resolution record not found"
        )

    return db_resolution


@router.put(
    "/{resolution_id}",
    response_model=ResolutionRecordResponse
)
def update_resolution_record(
    resolution_id: int,
    resolution_update: ResolutionRecordUpdate,
    db: Session = Depends(get_db)
):
    db_resolution = resolution_record_crud.update_resolution_record(
        db,
        resolution_id,
        resolution_update
    )

    if db_resolution is None:
        raise HTTPException(
            status_code=404,
            detail="Resolution record not found"
        )

    return db_resolution


@router.delete(
    "/{resolution_id}"
)
def delete_resolution_record(
    resolution_id: int,
    db: Session = Depends(get_db)
):
    db_resolution = resolution_record_crud.delete_resolution_record(
        db,
        resolution_id
    )

    if db_resolution is None:
        raise HTTPException(
            status_code=404,
            detail="Resolution record not found"
        )

    return {
        "message": "Resolution record deleted successfully"
    }