from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.crud import machine as machine_crud
from app.schemas.machine import (
    MachineCreate,
    MachineUpdate,
    MachineResponse
)


router = APIRouter(
    prefix="/machines",
    tags=["Machines"]
)


@router.post(
    "/",
    response_model=MachineResponse
)
def create_machine(
    machine: MachineCreate,
    db: Session = Depends(get_db)
):
    return machine_crud.create_machine(
        db,
        machine
    )


@router.get(
    "/",
    response_model=list[MachineResponse]
)
def read_machines(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    return machine_crud.get_machines(
        db,
        skip=skip,
        limit=limit
    )


@router.get(
    "/{machine_id}",
    response_model=MachineResponse
)
def read_machine(
    machine_id: int,
    db: Session = Depends(get_db)
):
    db_machine = machine_crud.get_machine(
        db,
        machine_id
    )

    if db_machine is None:
        raise HTTPException(
            status_code=404,
            detail="Machine not found"
        )

    return db_machine


@router.put(
    "/{machine_id}",
    response_model=MachineResponse
)
def update_machine(
    machine_id: int,
    machine: MachineUpdate,
    db: Session = Depends(get_db)
):
    db_machine = machine_crud.update_machine(
        db,
        machine_id,
        machine
    )

    if db_machine is None:
        raise HTTPException(
            status_code=404,
            detail="Machine not found"
        )

    return db_machine


@router.delete(
    "/{machine_id}"
)
def delete_machine(
    machine_id: int,
    db: Session = Depends(get_db)
):
    db_machine = machine_crud.delete_machine(
        db,
        machine_id
    )

    if db_machine is None:
        raise HTTPException(
            status_code=404,
            detail="Machine not found"
        )

    return {
        "message": "Machine deleted successfully"
    }