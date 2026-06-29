from pydantic import BaseModel
from typing import Optional

class AccountBase(BaseModel):
    basic_pay: int = 0
    hra: int = 0
    loan_amount: int = 0
    client_incentive: int = 0
    deduction_amount: int = 0
    total_leaves: float = 0.0
    ld: int = 0
    net_payable_salary: int = 0
    ctc_offered: int = 0
    incentives: int = 0
    client_total: int = 0
    total_net_payable_salary: int = 0
    gross_salary: int = 0
    pf: float = 0.0
    tdf: float = 0.0
    total_gross_salary: int = 0

class AccountCreate(AccountBase):
    employee_id: int

class AccountUpdate(BaseModel):
    basic_pay: Optional[int] = None
    hra: Optional[int] = None
    loan_amount: Optional[int] = None
    client_incentive: Optional[int] = None
    deduction_amount: Optional[int] = None
    total_leaves: Optional[float] = None
    ld: Optional[int] = None
    net_payable_salary: Optional[int] = None
    ctc_offered: Optional[int] = None
    incentives: Optional[int] = None
    client_total: Optional[int] = None
    total_net_payable_salary: Optional[int] = None
    gross_salary: Optional[int] = None
    pf: Optional[float] = None
    tdf: Optional[float] = None
    total_gross_salary: Optional[int] = None

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

class AccountListResponse(AccountBase):
    id: Optional[int] = None
    employee_id: int
    employee: EmployeeShortInfo

    model_config = {
        "from_attributes": True
    }
