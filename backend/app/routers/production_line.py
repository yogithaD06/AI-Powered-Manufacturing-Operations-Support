from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.crud import production_line as production_line_crud
from app.schemas.production_line import (
    ProductionLineCreate,
    ProductionLineUpdate,
    ProductionLineResponse
)


router = APIRouter(
    prefix="/production-lines",
    tags=["Production Lines"]
)


@router.post(
    "/",
    response_model=ProductionLineResponse
)
def create_production_line(
    production_line: ProductionLineCreate,
    db: Session = Depends(get_db)
):
    return production_line_crud.create_production_line(
        db,
        production_line
    )


@router.get(
    "/",
    response_model=list[ProductionLineResponse]
)
def read_production_lines(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    return production_line_crud.get_production_lines(
        db,
        skip=skip,
        limit=limit
    )


@router.get(
    "/{line_id}",
    response_model=ProductionLineResponse
)
def read_production_line(
    line_id: int,
    db: Session = Depends(get_db)
):
    db_line = production_line_crud.get_production_line(
        db,
        line_id
    )

    if db_line is None:
        raise HTTPException(
            status_code=404,
            detail="Production line not found"
        )

    return db_line


@router.put(
    "/{line_id}",
    response_model=ProductionLineResponse
)
def update_production_line(
    line_id: int,
    production_line: ProductionLineUpdate,
    db: Session = Depends(get_db)
):
    db_line = production_line_crud.update_production_line(
        db,
        line_id,
        production_line
    )

    if db_line is None:
        raise HTTPException(
            status_code=404,
            detail="Production line not found"
        )

    return db_line


@router.delete(
    "/{line_id}"
)
def delete_production_line(
    line_id: int,
    db: Session = Depends(get_db)
):
    db_line = production_line_crud.delete_production_line(
        db,
        line_id
    )

    if db_line is None:
        raise HTTPException(
            status_code=404,
            detail="Production line not found"
        )

    return {
        "message": "Production line deleted successfully"
    }