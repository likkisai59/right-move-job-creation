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

def get_leaves_for_approval(db: Session, manager_name: str) -> List[dict]:
    """
    Fetch leave requests of employees who report to the given manager.
    """
    clean_manager_name = "".join(manager_name.split()).lower()
    all_employees = db.query(Employee).all()
    reporting_employee_ids = []
    employee_map = {}
    for emp in all_employees:
        if emp.reporting_to:
            clean_reporting_to = "".join(emp.reporting_to.split()).lower()
            if clean_reporting_to == clean_manager_name:
                reporting_employee_ids.append(emp.id)
                employee_map[emp.id] = emp
                
    if not reporting_employee_ids:
        return []
        
    leaves = db.query(Leave).filter(Leave.employee_id.in_(reporting_employee_ids)).order_by(Leave.start_date.desc()).all()
    
    result = []
    for leave in leaves:
        emp = employee_map.get(leave.employee_id)
        result.append({
            "id": leave.id,
            "employee_id": leave.employee_id,
            "employee_name": f"{emp.first_name} {emp.last_name}" if emp else "Unknown",
            "employee_code": emp.employee_id if emp else "N/A",
            "leave_type": leave.leave_type,
            "start_date": leave.start_date,
            "end_date": leave.end_date,
            "reason": leave.reason,
            "status": leave.status,
            "approved_by": leave.approved_by
        })
    return result

def action_leave_request(db: Session, leave_id: int, status: str, manager_name: str) -> Optional[Leave]:
    """
    Approve or reject a leave request.
    """
    leave = db.query(Leave).filter(Leave.id == leave_id).first()
    if not leave:
        return None
    leave.status = status
    leave.approved_by = manager_name
    db.commit()
    db.refresh(leave)
    return leave

def get_team_attendance(db: Session, manager_name: str) -> List[dict]:
    """
    Fetch the last 14 days of attendance for employees reporting to the given manager.
    """
    from datetime import date, timedelta
    clean_manager_name = "".join(manager_name.split()).lower()
    all_employees = db.query(Employee).all()
    reporting_employees = []
    reporting_ids = []
    for emp in all_employees:
        if emp.reporting_to:
            clean_reporting_to = "".join(emp.reporting_to.split()).lower()
            if clean_reporting_to == clean_manager_name:
                reporting_employees.append(emp)
                reporting_ids.append(emp.id)
                
    if not reporting_ids:
        return []
        
    start_date = date.today() - timedelta(days=14)
    attendance_records = db.query(Attendance).filter(
        Attendance.employee_id.in_(reporting_ids),
        Attendance.attendance_date >= start_date
    ).all()
    
    attendance_by_emp = {}
    for record in attendance_records:
        if record.employee_id not in attendance_by_emp:
            attendance_by_emp[record.employee_id] = []
        attendance_by_emp[record.employee_id].append(record)
        
    result = []
    for emp in reporting_employees:
        emp_records = attendance_by_emp.get(emp.id, [])
        emp_records.sort(key=lambda x: x.attendance_date)
        
        result.append({
            "employee_id": emp.id,
            "employee_code": emp.employee_id,
            "employee_name": f"{emp.first_name} {emp.last_name}",
            "designation": emp.designation or "Staff",
            "attendance": [
                {
                    "id": rec.id,
                    "attendance_date": rec.attendance_date,
                    "first_half_status": rec.first_half_status,
                    "second_half_status": rec.second_half_status,
                    "work_mode": rec.work_mode
                }
                for rec in emp_records
            ]
        })
    return result

