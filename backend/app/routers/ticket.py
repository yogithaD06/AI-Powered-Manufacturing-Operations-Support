from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.crud import ticket as ticket_crud
from app.schemas.ticket import (
    TicketCreate,
    TicketUpdate,
    TicketResponse
)


router = APIRouter(
    prefix="/tickets",
    tags=["Tickets"]
)


def format_ticket_response(db_ticket):
    return {
        "ticket_id": db_ticket.ticket_id,
        "incident_id": db_ticket.incident_id,
        "assigned_to": db_ticket.assigned_engineer_id,
        "assigned_department_id": db_ticket.assigned_department_id,
        "ticket_type": None,
        "priority": db_ticket.escalation_level,
        "status": db_ticket.status,
        "due_date": db_ticket.due_date,
        "resolution_summary": db_ticket.resolution_notes,
        "created_at": db_ticket.created_at,
        "updated_at": None,
    }


@router.post(
    "/",
    response_model=TicketResponse
)
def create_ticket(
    ticket: TicketCreate,
    db: Session = Depends(get_db)
):
    db_ticket = ticket_crud.create_ticket(
        db,
        ticket
    )

    return format_ticket_response(db_ticket)


@router.get(
    "/",
    response_model=list[TicketResponse]
)
def read_tickets(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    db_tickets = ticket_crud.get_tickets(
        db,
        skip=skip,
        limit=limit
    )

    return [
        format_ticket_response(ticket)
        for ticket in db_tickets
    ]


@router.get(
    "/{ticket_id}",
    response_model=TicketResponse
)
def read_ticket(
    ticket_id: int,
    db: Session = Depends(get_db)
):
    db_ticket = ticket_crud.get_ticket(
        db,
        ticket_id
    )

    if db_ticket is None:
        raise HTTPException(
            status_code=404,
            detail="Ticket not found"
        )

    return format_ticket_response(db_ticket)


@router.put(
    "/{ticket_id}",
    response_model=TicketResponse
)
def update_ticket(
    ticket_id: int,
    ticket: TicketUpdate,
    db: Session = Depends(get_db)
):
    db_ticket = ticket_crud.update_ticket(
        db,
        ticket_id,
        ticket
    )

    if db_ticket is None:
        raise HTTPException(
            status_code=404,
            detail="Ticket not found"
        )

    return format_ticket_response(db_ticket)


@router.delete(
    "/{ticket_id}"
)
def delete_ticket(
    ticket_id: int,
    db: Session = Depends(get_db)
):
    db_ticket = ticket_crud.delete_ticket(
        db,
        ticket_id
    )

    if db_ticket is None:
        raise HTTPException(
            status_code=404,
            detail="Ticket not found"
        )

    return {
        "message": "Ticket deleted successfully"
    }