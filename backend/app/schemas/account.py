from pydantic import BaseModel
from typing import Optional
from datetime import date as dt_date

class AccountBase(BaseModel):
    basic_pay: int = 0
    hra: int = 0
    loan_amount: int = 0
    client_incentive: int = 0
    deduction_amount: int = 0
    unpaid_leaves: float = 0.0
    unpaid_leave_amount: int = 0
    net_payable_salary: int = 0
    ctc_offered: int = 0
    incentives: int = 0
    candidate_incentives: int = 0
    client_total: int = 0
    total_net_payable_salary: int = 0
    gross_salary: int = 0
    pf: float = 0.0
    tds: float = 0.0
    additional_incentive: int = 0
    incentive_deducted: int = 0
    loan_deducted: int = 0
    net_salary_pay: int = 0
    calculated_basic_pay: int = 0
    baseline_status: int = 0

class AccountCreate(AccountBase):
    employee_id: int

class AccountUpdate(BaseModel):
    basic_pay: Optional[int] = None
    hra: Optional[int] = None
    loan_amount: Optional[int] = None
    client_incentive: Optional[int] = None
    deduction_amount: Optional[int] = None
    unpaid_leaves: Optional[float] = None
    unpaid_leave_amount: Optional[int] = None
    net_payable_salary: Optional[int] = None
    ctc_offered: Optional[int] = None
    incentives: Optional[int] = None
    candidate_incentives: Optional[int] = None
    client_total: Optional[int] = None
    total_net_payable_salary: Optional[int] = None
    gross_salary: Optional[int] = None
    pf: Optional[float] = None
    tds: Optional[float] = None
    additional_incentive: Optional[int] = None
    incentive_deducted: Optional[int] = None
    loan_deducted: Optional[int] = None
    net_salary_pay: Optional[int] = None
    calculated_basic_pay: Optional[int] = None
    baseline_status: Optional[int] = None

class AccountResponse(AccountBase):
    id: int
    employee_id: int

    model_config = {
        "from_attributes": True
    }

class EmployeeShortInfo(BaseModel):
    employee_id: str
    first_name: Optional[str] = ""
    last_name: Optional[str] = ""
    compliance: Optional[str] = ""
    date_of_joining: Optional[dt_date] = None
    date: Optional[dt_date] = None
    ctc: Optional[float] = None
    status: Optional[str] = ""
    pan_number: Optional[str] = ""
    bank_account_number: Optional[str] = ""
    bank_name: Optional[str] = ""
    assigned_business_unit: Optional[str] = ""
    designation: Optional[str] = ""

class AccountListResponse(AccountBase):
    id: Optional[int] = None
    employee_id: int
    employee: EmployeeShortInfo

    model_config = {
        "from_attributes": True
    }

class PlacementResponse(BaseModel):
    approval_date: Optional[dt_date] = None
    candidate_code: str
    candidate_name: str
    organization_id: Optional[str] = None
    organization_name: Optional[str] = None
    location: Optional[str] = None
    job_designation: Optional[str] = None
    incentive: Optional[str] = None
    rate_card: Optional[str] = None
    band: Optional[str] = None
    employee_id: Optional[str] = None
    employee_name: Optional[str] = None

    model_config = {
        "from_attributes": True
    }
