from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.crud import rca_record as rca_record_crud
from app.schemas.rca_record import (
    RCARecordCreate,
    RCARecordUpdate,
    RCARecordResponse
)


router = APIRouter(
    prefix="/rca-records",
    tags=["RCA Records"]
)


@router.post(
    "/",
    response_model=RCARecordResponse
)
def create_rca_record(
    rca_record: RCARecordCreate,
    db: Session = Depends(get_db)
):
    return rca_record_crud.create_rca_record(
        db,
        rca_record
    )


@router.get(
    "/",
    response_model=list[RCARecordResponse]
)
def read_rca_records(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    return rca_record_crud.get_rca_records(
        db,
        skip=skip,
        limit=limit
    )


@router.get(
    "/{rca_id}",
    response_model=RCARecordResponse
)
def read_rca_record(
    rca_id: int,
    db: Session = Depends(get_db)
):
    db_rca = rca_record_crud.get_rca_record(
        db,
        rca_id
    )

    if db_rca is None:
        raise HTTPException(
            status_code=404,
            detail="RCA record not found"
        )

    return db_rca


@router.put(
    "/{rca_id}",
    response_model=RCARecordResponse
)
def update_rca_record(
    rca_id: int,
    rca_record: RCARecordUpdate,
    db: Session = Depends(get_db)
):
    db_rca = rca_record_crud.update_rca_record(
        db,
        rca_id,
        rca_record
    )

    if db_rca is None:
        raise HTTPException(
            status_code=404,
            detail="RCA record not found"
        )

    return db_rca


@router.delete(
    "/{rca_id}"
)
def delete_rca_record(
    rca_id: int,
    db: Session = Depends(get_db)
):
    db_rca = rca_record_crud.delete_rca_record(
        db,
        rca_id
    )

    if db_rca is None:
        raise HTTPException(
            status_code=404,
            detail="RCA record not found"
        )

    return {
        "message": "RCA record deleted successfully"
    }