from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import date

from app.core.database import get_db
from app.models.employee import Employee
from app.models.attendance import Attendance
from app.models.shift import Shift
from app.models.leave import Leave
from app.schemas.attendance import (
    EmployeeLoginRequest, 
    AttendanceCreate, AttendanceResponse,
    ShiftResponse, LeaveCreate, LeaveResponse
)
from app.utils.response import success_response, error_response

router = APIRouter(prefix="/api/attendance", tags=["Employee Attendance Portal"])

# ── Employee Login ───────────────────────────────────────────
@router.post("/login")
def employee_login(payload: EmployeeLoginRequest, db: Session = Depends(get_db)):
    """
    Login for employees using Name as username and Employee ID as password.
    """
    # Find employee by checking if first_name + last_name matches
    # This is a simplified check as per user request.
    employees = db.query(Employee).all()
    target_emp = None
    
    for emp in employees:
        full_name = f"{emp.first_name} {emp.last_name}".strip().lower()
        if full_name == payload.username.strip().lower() and emp.employee_id == payload.password:
            target_emp = emp
            break
            
    if not target_emp:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Name or Employee ID"
        )
        
    return success_response("Login successful", {
        "employee": {
            "id": target_emp.id,
            "employee_id": target_emp.employee_id,
            "name": f"{target_emp.first_name} {target_emp.last_name}",
            "designation": target_emp.designation,
            "email": target_emp.email,
            "contact": target_emp.contact_number
        },
        "token": f"emp-session-{target_emp.employee_id}" # Mock token
    })

# ── Attendance Marking ───────────────────────────────────────
@router.post("/mark", response_model=AttendanceResponse)
def mark_attendance(employee_id: int, payload: AttendanceCreate, db: Session = Depends(get_db)):
    # Check if already marked for today
    existing = db.query(Attendance).filter(
        Attendance.employee_id == employee_id,
        Attendance.attendance_date == payload.attendance_date
    ).first()
    
    if existing:
        # Update existing
        existing.status = payload.status
        existing.work_mode = payload.work_mode
        db.commit()
        db.refresh(existing)
        return existing
        
    new_record = Attendance(
        employee_id=employee_id,
        **payload.dict()
    )
    db.add(new_record)
    db.commit()
    db.refresh(new_record)
    return new_record

@router.get("/history/{employee_id}", response_model=List[AttendanceResponse])
def get_attendance_history(employee_id: int, db: Session = Depends(get_db)):
    return db.query(Attendance).filter(Attendance.employee_id == employee_id).all()

# ── Shift Management ─────────────────────────────────────────
@router.get("/shift/{employee_id}", response_model=List[ShiftResponse])
def get_employee_shift(employee_id: int, db: Session = Depends(get_db)):
    return db.query(Shift).filter(Shift.employee_id == employee_id).all()

# ── Leave Management ─────────────────────────────────────────
@router.post("/leave/apply", response_model=LeaveResponse)
def apply_leave(payload: LeaveCreate, db: Session = Depends(get_db)):
    new_leave = Leave(**payload.dict())
    db.add(new_leave)
    db.commit()
    db.refresh(new_leave)
    return new_leave

@router.get("/leave/history/{employee_id}", response_model=List[LeaveResponse])
def get_leave_history(employee_id: int, db: Session = Depends(get_db)):
    return db.query(Leave).filter(Leave.employee_id == employee_id).all()
