from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.employee import Employee
from app.models.attendance import Attendance
from app.models.shift import Shift
from app.models.leave import Leave
from app.schemas.attendance import AttendanceCreate, LeaveCreate

def authenticate_employee(db: Session, username: str, password: str) -> Optional[Employee]:
    """
    Authenticate employee by checking if first_name + last_name matches and password is the employee_id.
    """
    employees = db.query(Employee).all()
    for emp in employees:
        full_name = f"{emp.first_name} {emp.last_name}".strip().lower()
        if full_name == username.strip().lower() and emp.employee_id == password:
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

def get_employee_attendance_history(db: Session, employee_id: int) -> List[Attendance]:
    """
    Fetch all attendance records for an employee.
    """
    return db.query(Attendance).filter(Attendance.employee_id == employee_id).all()

def get_employee_shift_records(db: Session, employee_id: int) -> List[Shift]:
    """
    Fetch shift records for an employee.
    ```
    """
    return db.query(Shift).filter(Shift.employee_id == employee_id).all()

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
