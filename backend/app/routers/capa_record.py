from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.crud import capa_record as capa_record_crud
from app.schemas.capa_record import (
    CAPARecordCreate,
    CAPARecordUpdate,
    CAPARecordResponse
)


router = APIRouter(
    prefix="/capa-records",
    tags=["CAPA Records"]
)


@router.post(
    "/",
    response_model=CAPARecordResponse
)
def create_capa_record(
    capa_record: CAPARecordCreate,
    db: Session = Depends(get_db)
):
    return capa_record_crud.create_capa_record(
        db,
        capa_record
    )


@router.get(
    "/",
    response_model=list[CAPARecordResponse]
)
def read_capa_records(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    return capa_record_crud.get_capa_records(
        db,
        skip=skip,
        limit=limit
    )


@router.get(
    "/{capa_id}",
    response_model=CAPARecordResponse
)
def read_capa_record(
    capa_id: int,
    db: Session = Depends(get_db)
):
    db_capa = capa_record_crud.get_capa_record(
        db,
        capa_id
    )

    if db_capa is None:
        raise HTTPException(
            status_code=404,
            detail="CAPA record not found"
        )

    return db_capa


@router.put(
    "/{capa_id}",
    response_model=CAPARecordResponse
)
def update_capa_record(
    capa_id: int,
    capa_update: CAPARecordUpdate,
    db: Session = Depends(get_db)
):
    db_capa = capa_record_crud.update_capa_record(
        db,
        capa_id,
        capa_update
    )

    if db_capa is None:
        raise HTTPException(
            status_code=404,
            detail="CAPA record not found"
        )

    return db_capa


@router.delete(
    "/{capa_id}"
)
def delete_capa_record(
    capa_id: int,
    db: Session = Depends(get_db)
):
    db_capa = capa_record_crud.delete_capa_record(
        db,
        capa_id
    )

    if db_capa is None:
        raise HTTPException(
            status_code=404,
            detail="CAPA record not found"
        )

    return {
        "message": "CAPA record deleted successfully"
    }