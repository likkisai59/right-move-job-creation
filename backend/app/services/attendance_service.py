from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.employee import Employee
from app.models.attendance import Attendance
from app.models.leave import Leave
from app.schemas.attendance import AttendanceCreate, LeaveCreate

def authenticate_employee(db: Session, username: str, password: str) -> Optional[Employee]:
    """
    Authenticate employee by checking if first_name + last_name matches and password is the employee_id.
    Robust to trailing/leading spaces, case-insensitivity, and spacing differences.
    """
    clean_username = "".join(username.split()).lower()
    clean_password = password.strip()
    
    employees = db.query(Employee).all()
    for emp in employees:
        db_full_name = "".join(f"{emp.first_name}{emp.last_name}".split()).lower()
        if db_full_name == clean_username and emp.employee_id.strip() == clean_password:
            return emp
    return None

def mark_employee_attendance(db: Session, employee_id: int, payload: AttendanceCreate) -> Attendance:
    """
    Mark or update employee attendance for a given date.
    """
    existing = db.query(Attendance).filter(
        Attendance.employee_id == employee_id,
        Attendance.attendance_date == payload.attendance_date
    ).first()
    
    if existing:
        existing.first_half_status = payload.first_half_status
        existing.second_half_status = payload.second_half_status
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

def get_employee_attendance_history(
    db: Session, 
    employee_id: int,
    sort_by: Optional[str] = None,
    sort_order: Optional[str] = "desc"
) -> List[Attendance]:
    """
    Fetch all attendance records for an employee.
    """
    query = db.query(Attendance).filter(Attendance.employee_id == employee_id)
    from app.utils.sorting import apply_sorting
    return apply_sorting(query, Attendance, sort_by, sort_order, Attendance.attendance_date).all()

def create_leave_request(db: Session, payload: LeaveCreate) -> Leave:
    """
    Apply for a new leave request.
    """
    new_leave = Leave(**payload.dict())
    db.add(new_leave)
    db.commit()
    db.refresh(new_leave)
    return new_leave

def get_employee_leave_history(db: Session, employee_id: int) -> List[Leave]:
    """
    Fetch all leave requests for an employee.
    """
    return db.query(Leave).filter(Leave.employee_id == employee_id).all()
