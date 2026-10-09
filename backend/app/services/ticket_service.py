from sqlalchemy.orm import Session
from sqlalchemy import or_
from datetime import date
from app.models.ticket import Ticket
from app.models.employee import Employee
from app.schemas.ticket import TicketCreate

def list_assignable_admins(db: Session, emp_id: str = None):
    roles = ["hr", "admin_user", "admin_admin", "super_admin", "account_user"]
    employees = db.query(Employee).filter(
        Employee.system_role.in_(roles),
        Employee.status == "Active" # Assuming active employees only
    ).all()
    
    manager = None
    # Add reporting manager if emp_id is provided
    if emp_id:
        current_emp = db.query(Employee).filter(Employee.employee_id == emp_id).first()
        if current_emp and current_emp.reporting_to:
            manager_name = current_emp.reporting_to.strip().lower()
            # Search all employees, not just active ones
            for e in db.query(Employee).all():
                if f"{e.first_name} {e.last_name}".strip().lower() == manager_name:
                    manager = e
                    break
            
            if manager and manager not in employees:
                employees.append(manager)
    
    result = []
    for emp in employees:
        result.append({
            "employee_id": emp.employee_id,
            "name": f"{emp.first_name} {emp.last_name}".strip(),
            "role": emp.system_role,
            "is_active": (emp.status == "Active"),
            "is_manager": (manager is not None and emp.id == manager.id)
        })
    return result

def create_ticket(db: Session, payload: TicketCreate, raised_by_emp_id: str):
    new_ticket = Ticket(
        description=payload.description,
        assigned_to=payload.assigned_to,
        raised_by=raised_by_emp_id,
        status="OPEN"
    )
    db.add(new_ticket)
    db.commit()
    db.refresh(new_ticket)
    return new_ticket

def list_tickets(db: Session, role: str, emp_id: str):
    if role in ["user", "leader"]:
        # Requesters see tickets they raised
        tickets = db.query(Ticket).filter(Ticket.raised_by == emp_id).all()
    else:
        # Resolvers (hr, admin, etc.) see tickets assigned to them
        tickets = db.query(Ticket).filter(Ticket.assigned_to == emp_id).all()
    
    return tickets

def resolve_ticket(db: Session, ticket_id: int, resolved_by_emp_id: str):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        return None
    
    ticket.status = "RESOLVED"
    ticket.resolved_by = resolved_by_emp_id
    ticket.resolved_on = date.today()
    
    db.commit()
    db.refresh(ticket)
    return ticket
