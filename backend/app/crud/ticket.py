from uuid import uuid4

from sqlalchemy.orm import Session

from app.models.ticket import Ticket
from app.schemas.ticket import TicketCreate, TicketUpdate


def create_ticket(db: Session, ticket: TicketCreate):
    # Generate a unique ticket number
    ticket_number = f"TKT-{uuid4().hex[:10].upper()}"

    db_ticket = Ticket(
        ticket_number=ticket_number,

        incident_id=ticket.incident_id,

        assigned_department_id=ticket.assigned_department_id,
        assigned_engineer_id=ticket.assigned_to,

        due_date=ticket.due_date,
        status=ticket.status,

        # Map API field to database field
        escalation_level=ticket.priority,

        # Map resolution summary to resolution notes
        resolution_notes=ticket.resolution_summary,
    )

    db.add(db_ticket)
    db.commit()
    db.refresh(db_ticket)

    return db_ticket


def get_ticket(db: Session, ticket_id: int):
    return (
        db.query(Ticket)
        .filter(Ticket.ticket_id == ticket_id)
        .first()
    )


def get_tickets(
    db: Session,
    skip: int = 0,
    limit: int = 100
):
    return (
        db.query(Ticket)
        .offset(skip)
        .limit(limit)
        .all()
    )


def update_ticket(
    db: Session,
    ticket_id: int,
    ticket: TicketUpdate
):
    db_ticket = get_ticket(db, ticket_id)

    if db_ticket is None:
        return None

    update_data = ticket.model_dump(exclude_unset=True)

    # Map Swagger/API field names to database model fields
    field_mapping = {
        "assigned_to": "assigned_engineer_id",
        "priority": "escalation_level",
        "resolution_summary": "resolution_notes",
    }

    # ticket_type does not have a corresponding
    # column in the current database model,
    # so it is not stored.

    update_data.pop("ticket_type", None)

    for field, value in update_data.items():
        db_field = field_mapping.get(field, field)
        setattr(db_ticket, db_field, value)

    db.commit()
    db.refresh(db_ticket)

    return db_ticket


def delete_ticket(db: Session, ticket_id: int):
    db_ticket = get_ticket(db, ticket_id)

    if db_ticket is None:
        return None

    db.delete(db_ticket)
    db.commit()

    return db_ticket