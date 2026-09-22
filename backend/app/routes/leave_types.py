from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel

from app.core.database import get_db
from app.models.leave_type import LeaveType

router = APIRouter(prefix="/api/leave-types", tags=["Leave Types"])

# Pydantic Schemas
class LeaveTypeBase(BaseModel):
    name: str

class LeaveTypeCreate(LeaveTypeBase):
    pass

class LeaveTypeUpdate(BaseModel):
    is_active: bool

class LeaveTypeOut(LeaveTypeBase):
    id: int
    is_active: bool

    class Config:
        from_attributes = True

@router.get("/", response_model=List[LeaveTypeOut])
def get_leave_types(active_only: bool = False, db: Session = Depends(get_db)):
    """
    Fetch all leave types.
    """
    query = db.query(LeaveType)
    if active_only:
        query = query.filter(LeaveType.is_active == True)
    return query.all()

@router.post("/", response_model=LeaveTypeOut, status_code=status.HTTP_201_CREATED)
def create_leave_type(leave_type_in: LeaveTypeCreate, db: Session = Depends(get_db)):
    """
    Create a new leave type.
    """
    existing = db.query(LeaveType).filter(LeaveType.name == leave_type_in.name.strip()).first()
    if existing:
        raise HTTPException(status_code=400, detail="Leave type already exists")
    
    new_type = LeaveType(name=leave_type_in.name.strip())
    db.add(new_type)
    db.commit()
    db.refresh(new_type)
    return new_type

@router.put("/{type_id}", response_model=LeaveTypeOut)
def update_leave_type(type_id: int, leave_type_in: LeaveTypeUpdate, db: Session = Depends(get_db)):
    """
    Update leave type status.
    """
    leave_type = db.query(LeaveType).filter(LeaveType.id == type_id).first()
    if not leave_type:
        raise HTTPException(status_code=404, detail="Leave type not found")
    
    leave_type.is_active = leave_type_in.is_active
    db.commit()
    db.refresh(leave_type)
    return leave_type
