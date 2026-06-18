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
    model_config = {
        "from_attributes": True
    }

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
    model_config = {
        "from_attributes": True
    }

# ── Approvals & Team Management ───────────────────────────────
class LeaveActionRequest(BaseModel):
    status: str  # Approved, Rejected
    manager_name: str

class TeamLeaveResponse(BaseModel):
    id: int
    employee_id: int
    employee_name: str
    employee_code: str
    leave_type: str
    start_date: date
    end_date: date
    reason: Optional[str] = None
    status: str
    approved_by: Optional[str] = None
    model_config = {
        "from_attributes": True
    }

class TeamDailyAttendance(BaseModel):
    id: Optional[int] = None
    attendance_date: date
    first_half_status: str
    second_half_status: str
    work_mode: str
    model_config = {
        "from_attributes": True
    }

class TeamMemberAttendanceResponse(BaseModel):
    employee_id: int
    employee_code: str
    employee_name: str
    designation: str
    attendance: List[TeamDailyAttendance]
    model_config = {
        "from_attributes": True
    }

# ── Designation leaves & holiday config schemas ────────────────
class DesignationLeaveUpdateItem(BaseModel):
    id: int
    leaves: float
    holidays: List[dict]

class LeaveConfigResponse(BaseModel):
    leaves: Optional[float] = 30.0
    holidays: List[dict]


