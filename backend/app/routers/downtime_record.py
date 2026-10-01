from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.crud import downtime_record as downtime_record_crud
from app.schemas.downtime_record import (
    DowntimeRecordCreate,
    DowntimeRecordUpdate,
    DowntimeRecordResponse
)


router = APIRouter(
    prefix="/downtime-records",
    tags=["Downtime Records"]
)


@router.post(
    "/",
    response_model=DowntimeRecordResponse
)
def create_downtime_record(
    downtime_record: DowntimeRecordCreate,
    db: Session = Depends(get_db)
):
    return downtime_record_crud.create_downtime_record(
        db,
        downtime_record
    )


@router.get(
    "/",
    response_model=list[DowntimeRecordResponse]
)
def read_downtime_records(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    return downtime_record_crud.get_downtime_records(
        db,
        skip=skip,
        limit=limit
    )


@router.get(
    "/{downtime_id}",
    response_model=DowntimeRecordResponse
)
def read_downtime_record(
    downtime_id: int,
    db: Session = Depends(get_db)
):
    db_downtime = downtime_record_crud.get_downtime_record(
        db,
        downtime_id
    )

    if db_downtime is None:
        raise HTTPException(
            status_code=404,
            detail="Downtime record not found"
        )

    return db_downtime


@router.put(
    "/{downtime_id}",
    response_model=DowntimeRecordResponse
)
def update_downtime_record(
    downtime_id: int,
    downtime_record: DowntimeRecordUpdate,
    db: Session = Depends(get_db)
):
    db_downtime = downtime_record_crud.update_downtime_record(
        db,
        downtime_id,
        downtime_record
    )

    if db_downtime is None:
        raise HTTPException(
            status_code=404,
            detail="Downtime record not found"
        )

    return db_downtime


@router.delete(
    "/{downtime_id}"
)
def delete_downtime_record(
    downtime_id: int,
    db: Session = Depends(get_db)
):
    db_downtime = downtime_record_crud.delete_downtime_record(
        db,
        downtime_id
    )

    if db_downtime is None:
        raise HTTPException(
            status_code=404,
            detail="Downtime record not found"
        )

    return {
        "message": "Downtime record deleted successfully"
    }