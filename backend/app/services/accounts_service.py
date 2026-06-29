from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.account import Account
from app.models.employee import Employee
from app.models.leave import Leave
from app.schemas.account import AccountCreate, AccountUpdate
from typing import List, Tuple, Optional

def calculate_ld_and_net_payable(basic_pay: int, total_leaves: float) -> Tuple[int, int]:
    """
    Calculate LD and Net Payable Salary.
    LD = (basic salary // 30) * total leaves
    Net Payable Salary = basic salary - LD
    """
    ld = int((basic_pay // 30) * total_leaves)
    net_payable_salary = basic_pay - ld
    return ld, net_payable_salary

def get_recruiter_incentives_sum(db: Session, employee: Employee) -> int:
    """
    Sum incentives for approved/joined candidates recruited by this employee.
    Matches Candidate.recruiter_name case-insensitively with Employee full name.
    """
    emp_name = f"{employee.first_name} {employee.last_name}".strip()
    from app.models.candidate import Candidate
    from app.models.job_candidate import JobCandidateMapping
    
    mappings = db.query(JobCandidateMapping).join(Candidate).filter(
        func.lower(Candidate.recruiter_name) == func.lower(emp_name),
        JobCandidateMapping.status.in_(["Candidate Approved", "Joined"])
    ).all()
    
    total_incentives_sum = 0
    for m in mappings:
        if m.incentive:
            try:
                # Clean potential non-digits (e.g. currency symbols, commas)
                clean_inc = "".join(c for c in m.incentive if c.isdigit())
                if clean_inc:
                    total_incentives_sum += int(clean_inc)
            except ValueError:
                pass
    return total_incentives_sum

def list_accounts(db: Session) -> List[Account]:
    # Query all active employees
    employees = db.query(Employee).filter(Employee.status == "Active").all()
    
    result = []
    for emp in employees:
        account = db.query(Account).filter(Account.employee_id == emp.id).first()
        
        # Calculate sum of approved unpaid leaves
        unpaid_leaves_sum = db.query(func.sum(Leave.total_leaves)).filter(
            Leave.employee_id == emp.id,
            Leave.status == "Approved",
            Leave.leave_type.ilike("%unpaid%")
        ).scalar() or 0.0
        
        # Calculate recruiter incentives
        total_incentives_sum = get_recruiter_incentives_sum(db, emp)
        
        # CTC Offered from employees table
        ctc_val = int(emp.ctc) if emp.ctc is not None else 0
        
        if account:
            calculated_ld, calculated_net_payable = calculate_ld_and_net_payable(account.basic_pay, unpaid_leaves_sum)
            calculated_total_net_payable = calculated_net_payable + total_incentives_sum
            calculated_gross_salary = calculated_total_net_payable - account.deduction_amount
            
            # Sync to DB if stored value is different
            if (account.total_leaves != unpaid_leaves_sum or 
                account.ld != calculated_ld or 
                account.net_payable_salary != calculated_net_payable or
                account.incentives != total_incentives_sum or
                account.ctc_offered != ctc_val or
                account.total_net_payable_salary != calculated_total_net_payable or
                account.gross_salary != calculated_gross_salary):
                
                account.total_leaves = unpaid_leaves_sum
                account.ld = calculated_ld
                account.net_payable_salary = calculated_net_payable
                account.incentives = total_incentives_sum
                account.ctc_offered = ctc_val
                account.total_net_payable_salary = calculated_total_net_payable
                account.gross_salary = calculated_gross_salary
                db.commit()
                db.refresh(account)
            result.append(account)
        else:
            # Construct a default transient Account object linked to this employee
            calculated_total_net_payable = 0 + total_incentives_sum
            calculated_gross_salary = calculated_total_net_payable - 0 # default deduction is 0
            
            default_account = Account(
                id=None,
                employee_id=emp.id,
                basic_pay=0,
                hra=0,
                loan_amount=0,
                client_incentive=0,
                deduction_amount=0,
                total_leaves=unpaid_leaves_sum,
                ld=0,
                net_payable_salary=0,
                ctc_offered=ctc_val,
                incentives=total_incentives_sum,
                client_total=0,
                total_net_payable_salary=calculated_total_net_payable,
                gross_salary=calculated_gross_salary,
                pf=0.0,
                tdf=0.0,
                total_gross_salary=0
            )
            default_account.employee = emp
            result.append(default_account)
            
    return result

def create_account(db: Session, payload: AccountCreate) -> Account:
    # Check if employee exists
    employee = db.query(Employee).filter(Employee.id == payload.employee_id).first()
    if not employee:
        raise ValueError("Employee not found")

    # Check if account details already exist for this employee
    existing_account = db.query(Account).filter(Account.employee_id == payload.employee_id).first()
    if existing_account:
        raise ValueError("Account details already exist for this employee")

    # Create new account
    new_account = Account(
        **payload.model_dump()
    )
    
    # Recalculate LD and Net Payable Salary
    new_account.ld, new_account.net_payable_salary = calculate_ld_and_net_payable(
        new_account.basic_pay, new_account.total_leaves
    )
    
    # Sync CTC offered and incentives
    new_account.ctc_offered = int(employee.ctc) if employee.ctc is not None else 0
    new_account.incentives = get_recruiter_incentives_sum(db, employee)
    
    # Calculate derived salary totals
    new_account.total_net_payable_salary = new_account.net_payable_salary + new_account.incentives
    new_account.gross_salary = new_account.total_net_payable_salary - new_account.deduction_amount
    
    db.add(new_account)
    db.commit()
    db.refresh(new_account)
    return new_account

def get_account_by_employee(db: Session, employee_id: int) -> Optional[Account]:
    return db.query(Account).filter(Account.employee_id == employee_id).first()

def update_account(db: Session, employee_id: int, payload: AccountUpdate) -> Account:
    account = db.query(Account).filter(Account.employee_id == employee_id).first()
    if not account:
        raise ValueError("Account details not found for this employee")

    update_data = payload.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(account, key, value)

    # Recalculate LD and Net Payable Salary
    account.ld, account.net_payable_salary = calculate_ld_and_net_payable(
        account.basic_pay, account.total_leaves
    )

    # Sync CTC offered and incentives
    employee = db.query(Employee).filter(Employee.id == account.employee_id).first()
    if employee:
        account.ctc_offered = int(employee.ctc) if employee.ctc is not None else 0
        account.incentives = get_recruiter_incentives_sum(db, employee)

    # Calculate derived salary totals
    account.total_net_payable_salary = account.net_payable_salary + account.incentives
    account.gross_salary = account.total_net_payable_salary - account.deduction_amount

    db.commit()
    db.refresh(account)
    return account
