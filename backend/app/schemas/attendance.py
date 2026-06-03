from pydantic import BaseModel
from datetime import date, time
from typing import Optional, List

# ── Login ─────────────────────────────────────────────────────
class EmployeeLoginRequest(BaseModel):
    username: str  # First + Last Name
    password: str  # Employee ID

# ── Attendance ────────────────────────────────────────────────
class AttendanceBase(BaseModel):
    attendance_date: date
    first_half_status: str
    second_half_status: str
    work_mode: str

class AttendanceCreate(AttendanceBase):
    pass

class AttendanceResponse(AttendanceBase):
    id: int
    employee_id: int
    class Config:
        orm_mode = True

# ── Leave ─────────────────────────────────────────────────────
class LeaveBase(BaseModel):
    leave_type: str
    start_date: date
    end_date: date
    reason: Optional[str] = None

class LeaveCreate(LeaveBase):
    employee_id: int

class LeaveResponse(LeaveBase):
    id: int
    employee_id: int
    status: str
    approved_by: Optional[str] = None
    class Config:
        orm_mode = True
