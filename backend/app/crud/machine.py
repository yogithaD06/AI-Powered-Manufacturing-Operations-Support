from sqlalchemy.orm import Session

from app.models.machine import Machine
from app.schemas.machine import MachineCreate, MachineUpdate


def create_machine(db: Session, machine: MachineCreate):
    db_machine = Machine(
        machine_code=machine.machine_code,
        machine_name=machine.machine_name,
        machine_type=machine.machine_type,
        line_id=machine.line_id,
        department_id=machine.department_id,
        location=machine.location,
        installation_date=machine.installation_date,
        status=machine.status,
    )

    db.add(db_machine)
    db.commit()
    db.refresh(db_machine)

    return db_machine


def get_machine(db: Session, machine_id: int):
    return (
        db.query(Machine)
        .filter(Machine.machine_id == machine_id)
        .first()
    )


def get_machines(
    db: Session,
    skip: int = 0,
    limit: int = 100
):
    return (
        db.query(Machine)
        .offset(skip)
        .limit(limit)
        .all()
    )


def update_machine(
    db: Session,
    machine_id: int,
    machine: MachineUpdate
):
    db_machine = get_machine(db, machine_id)

    if db_machine is None:
        return None

    update_data = machine.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(db_machine, field, value)

    db.commit()
    db.refresh(db_machine)

    return db_machine


def delete_machine(db: Session, machine_id: int):
    db_machine = get_machine(db, machine_id)

    if db_machine is None:
        return None

    db.delete(db_machine)
    db.commit()

    return db_machine