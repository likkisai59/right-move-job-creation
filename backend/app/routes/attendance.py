from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.schemas.attendance import (
    EmployeeLoginRequest, 
    AttendanceCreate, AttendanceResponse,
    ShiftResponse, LeaveCreate, LeaveResponse
)
from app.services import attendance_service
from app.utils.response import success_response

router = APIRouter(prefix="/api/attendance", tags=["Employee Attendance Portal"])

# ── Employee Login ───────────────────────────────────────────
@router.post("/login")
def employee_login(payload: EmployeeLoginRequest, db: Session = Depends(get_db)):
    """
    Login for employees using Name as username and Employee ID as password.
    """
    target_emp = attendance_service.authenticate_employee(db, payload.username, payload.password)
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
    """
    Mark daily attendance (first half and second half).
    """
    return attendance_service.mark_employee_attendance(db, employee_id, payload)

@router.get("/history/{employee_id}", response_model=List[AttendanceResponse])
def get_attendance_history(employee_id: int, db: Session = Depends(get_db)):
    """
    Get weekly/monthly attendance history.
    """
    return attendance_service.get_employee_attendance_history(db, employee_id)

# ── Shift Management ─────────────────────────────────────────
@router.get("/shift/{employee_id}", response_model=List[ShiftResponse])
def get_employee_shift(employee_id: int, db: Session = Depends(get_db)):
    """
    Retrieve shift assignments.
    """
    return attendance_service.get_employee_shift_records(db, employee_id)

# ── Leave Management ─────────────────────────────────────────
@router.post("/leave/apply", response_model=LeaveResponse)
def apply_leave(payload: LeaveCreate, db: Session = Depends(get_db)):
    """
    Apply for employee leave.
    """
    return attendance_service.create_leave_request(db, payload)

@router.get("/leave/history/{employee_id}", response_model=List[LeaveResponse])
def get_leave_history(employee_id: int, db: Session = Depends(get_db)):
    """
    Retrieve leave application history.
    """
    return attendance_service.get_employee_leave_history(db, employee_id)
