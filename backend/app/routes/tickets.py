from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.schemas.ticket import TicketCreate, TicketResponse, TicketAssignee
from app.services import ticket_service

router = APIRouter(prefix="/api/tickets", tags=["tickets"])

@router.get("/assignees", response_model=List[TicketAssignee])
def get_assignees(db: Session = Depends(get_db)):
    return ticket_service.list_assignable_admins(db)

@router.post("/", response_model=TicketResponse)
def create_ticket(
    payload: TicketCreate,
    emp_id: str = Query(...),
    db: Session = Depends(get_db)
):
    return ticket_service.create_ticket(db, payload, emp_id)

@router.get("/", response_model=List[TicketResponse])
def get_tickets(
    role: str = Query(...),
    emp_id: str = Query(...),
    db: Session = Depends(get_db)
):
    return ticket_service.list_tickets(db, role, emp_id)

@router.put("/{ticket_id}/resolve", response_model=TicketResponse)
def resolve_ticket(
    ticket_id: int,
    emp_id: str = Query(...),
    db: Session = Depends(get_db)
):
    from fastapi import HTTPException
    ticket = ticket_service.resolve_ticket(db, ticket_id, emp_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return ticket
