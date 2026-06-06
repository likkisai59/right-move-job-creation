from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.schemas.attendance import (
    EmployeeLoginRequest, 
    AttendanceCreate, AttendanceResponse,
    LeaveCreate, LeaveResponse,
    LeaveActionRequest, TeamLeaveResponse, TeamMemberAttendanceResponse,
    DesignationLeaveUpdateItem, LeaveConfigResponse
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
def get_attendance_history(
    employee_id: int, 
    sort_by: str = None, 
    sort_order: str = "desc", 
    db: Session = Depends(get_db)
):
    """
    Get weekly/monthly attendance history.
    """
    return attendance_service.get_employee_attendance_history(db, employee_id, sort_by, sort_order)

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

# ── Approvals & Team Management ───────────────────────────────
@router.get("/approvals/leaves", response_model=List[TeamLeaveResponse])
def get_leaves_for_approval(manager_name: str, db: Session = Depends(get_db)):
    """
    Fetch leave requests of employees who report to the given manager.
    """
    return attendance_service.get_leaves_for_approval(db, manager_name)

@router.post("/approvals/leaves/{leave_id}/action", response_model=LeaveResponse)
def action_leave_request(leave_id: int, payload: LeaveActionRequest, db: Session = Depends(get_db)):
    """
    Approve or reject a leave request.
    """
    leave = attendance_service.action_leave_request(db, leave_id, payload.status, payload.manager_name)
    if not leave:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Leave request not found"
        )
    return leave

@router.get("/approvals/team-attendance", response_model=List[TeamMemberAttendanceResponse])
def get_team_attendance(manager_name: str, db: Session = Depends(get_db)):
    """
    Fetch recent attendance records for team members reporting to the manager.
    """
    return attendance_service.get_team_attendance(db, manager_name)

@router.get("/leave/config/{employee_id}", response_model=LeaveConfigResponse)
def get_leave_config(employee_id: int, db: Session = Depends(get_db)):
    """
    Fetch leave config (leaves count and holidays list) for employee's designation.
    """
    config = attendance_service.get_leave_config(db, employee_id)
    if not config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee not found"
        )
    return config

@router.post("/approvals/config")
def save_designation_config(payload: List[DesignationLeaveUpdateItem], db: Session = Depends(get_db)):
    """
    Save leave limits and holiday lists for multiple designations.
    """
    config_list = [item.model_dump() for item in payload]
    try:
        success = attendance_service.save_designation_config(db, config_list)
        return success_response("Configurations saved successfully", {"success": success})
    except ValueError as val_err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(val_err)
        )


