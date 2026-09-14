from pydantic import BaseModel
from typing import Optional
from datetime import date

class TicketCreate(BaseModel):
    description: str
    assigned_to: str

class TicketResponse(BaseModel):
    id: int
    description: str
    status: str
    raised_by: str
    assigned_to: str
    raised_on: date
    resolved_by: Optional[str] = None
    resolved_on: Optional[date] = None

    class Config:
        from_attributes = True

class TicketAssignee(BaseModel):
    employee_id: str
    name: str
    role: str
