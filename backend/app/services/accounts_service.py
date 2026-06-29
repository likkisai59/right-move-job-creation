from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.account import Account
from app.models.employee import Employee
from app.models.leave import Leave
from app.models.payroll_config import PayrollConfig
from app.models.invoice import Invoice
from app.models.job_candidate import JobCandidateMapping
from app.models.candidate import Candidate
from app.models.job_requirement import Job
from app.models.organization import Organization
from app.schemas.account import AccountCreate, AccountUpdate
from app.schemas.invoice import InvoiceUpdate
from typing import List, Tuple, Optional
from datetime import date

# ── PAYROLL CONFIGURATION SERVICES ───────────────────────────

def get_payroll_config(db: Session) -> PayrollConfig:
    """
    Retrieve the payroll configuration. Creates a default row if none exists.
    """
    config = db.query(PayrollConfig).first()
    if not config:
        config = PayrollConfig(pf_percentage=12.0, tds_percentage=10.0)
        db.add(config)
        db.commit()
        db.refresh(config)
    return config

def update_payroll_config(db: Session, pf_percentage: float, tds_percentage: float) -> PayrollConfig:
    """
    Update the PF and TDS configuration percentages.
    """
    config = get_payroll_config(db)
    config.pf_percentage = pf_percentage
    config.tds_percentage = tds_percentage
    db.commit()
    db.refresh(config)
    return config

# ── CALCULATION UTILITIES ─────────────────────────────────────

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
    
    mappings = db.query(JobCandidateMapping).join(Candidate).filter(
        func.lower(Candidate.recruiter_name) == func.lower(emp_name),
        JobCandidateMapping.status.in_(["Candidate Approved", "Joined"])
    ).all()
    
    total_incentives_sum = 0
    for m in mappings:
        if m.incentive:
            try:
                clean_inc = "".join(c for c in m.incentive if c.isdigit())
                if clean_inc:
                    total_incentives_sum += int(clean_inc)
            except ValueError:
                pass
    return total_incentives_sum

# ── ACCOUNTS MODULE CRUD ──────────────────────────────────────

def list_accounts(db: Session) -> List[Account]:
    # Query all active employees
    employees = db.query(Employee).filter(Employee.status == "Active").all()
    config = get_payroll_config(db)
    
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
            
            # Dynamic PF and TDS calculations based on compliance type
            calculated_pf = 0.0
            calculated_tds = 0.0
            if emp.compliance == "PF":
                calculated_pf = float(((account.basic_pay or 0) + (account.hra or 0)) * (config.pf_percentage / 100.0))
            elif emp.compliance == "TDS":
                calculated_tds = float(((account.basic_pay or 0) + (account.hra or 0)) * (config.tds_percentage / 100.0))
                
            calculated_total_gross = int(calculated_gross_salary - calculated_pf - calculated_tds)
            
            # Sync to DB if stored value is different
            if (account.total_leaves != unpaid_leaves_sum or 
                account.ld != calculated_ld or 
                account.net_payable_salary != calculated_net_payable or
                account.incentives != total_incentives_sum or
                account.ctc_offered != ctc_val or
                account.total_net_payable_salary != calculated_total_net_payable or
                account.gross_salary != calculated_gross_salary or
                account.pf != calculated_pf or
                account.tds != calculated_tds or
                account.total_gross_salary != calculated_total_gross):
                
                account.total_leaves = unpaid_leaves_sum
                account.ld = calculated_ld
                account.net_payable_salary = calculated_net_payable
                account.incentives = total_incentives_sum
                account.ctc_offered = ctc_val
                account.total_net_payable_salary = calculated_total_net_payable
                account.gross_salary = calculated_gross_salary
                account.pf = calculated_pf
                account.tds = calculated_tds
                account.total_gross_salary = calculated_total_gross
                db.commit()
                db.refresh(account)
            result.append(account)
        else:
            # Construct a default transient Account object linked to this employee
            calculated_total_net_payable = 0 + total_incentives_sum
            calculated_gross_salary = calculated_total_net_payable - 0
            
            calculated_pf = 0.0
            calculated_tds = 0.0
            if emp.compliance == "PF":
                calculated_pf = float((0 + 0) * (config.pf_percentage / 100.0))
            elif emp.compliance == "TDS":
                calculated_tds = float((0 + 0) * (config.tds_percentage / 100.0))
                
            calculated_total_gross = int(calculated_gross_salary - calculated_pf - calculated_tds)
            
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
                pf=calculated_pf,
                tds=calculated_tds,
                additional_incentive=0,
                incentive_deducted=0,
                loan_deducted=0,
                total_gross_salary=calculated_total_gross
            )
            default_account.employee = emp
            result.append(default_account)
            
    return result

def create_account(db: Session, payload: AccountCreate) -> Account:
    employee = db.query(Employee).filter(Employee.id == payload.employee_id).first()
    if not employee:
        raise ValueError("Employee not found")

    existing_account = db.query(Account).filter(Account.employee_id == payload.employee_id).first()
    if existing_account:
        raise ValueError("Account details already exist for this employee")

    new_account = Account(
        **payload.model_dump()
    )
    config = get_payroll_config(db)
    
    new_account.ld, new_account.net_payable_salary = calculate_ld_and_net_payable(
        new_account.basic_pay, new_account.total_leaves
    )
    
    new_account.ctc_offered = int(employee.ctc) if employee.ctc is not None else 0
    new_account.incentives = get_recruiter_incentives_sum(db, employee)
    
    new_account.total_net_payable_salary = new_account.net_payable_salary + new_account.incentives
    new_account.gross_salary = new_account.total_net_payable_salary - new_account.deduction_amount
    
    # Calculate PF/TDS and Total Gross
    if employee.compliance == "PF":
        new_account.pf = float(((new_account.basic_pay or 0) + (new_account.hra or 0)) * (config.pf_percentage / 100.0))
        new_account.tds = 0.0
    elif employee.compliance == "TDS":
        new_account.pf = 0.0
        new_account.tds = float(((new_account.basic_pay or 0) + (new_account.hra or 0)) * (config.tds_percentage / 100.0))
    else:
        new_account.pf = 0.0
        new_account.tds = 0.0
        
    new_account.total_gross_salary = int(new_account.gross_salary - new_account.pf - new_account.tds)
    
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

    account.ld, account.net_payable_salary = calculate_ld_and_net_payable(
        account.basic_pay, account.total_leaves
    )

    employee = db.query(Employee).filter(Employee.id == account.employee_id).first()
    if employee:
        account.ctc_offered = int(employee.ctc) if employee.ctc is not None else 0
        account.incentives = get_recruiter_incentives_sum(db, employee)

    account.total_net_payable_salary = account.net_payable_salary + account.incentives
    account.gross_salary = account.total_net_payable_salary - account.deduction_amount

    # Recalculate PF/TDS and Total Gross
    config = get_payroll_config(db)
    if employee:
        if employee.compliance == "PF":
            account.pf = float(((account.basic_pay or 0) + (account.hra or 0)) * (config.pf_percentage / 100.0))
            account.tds = 0.0
        elif employee.compliance == "TDS":
            account.pf = 0.0
            account.tds = float(((account.basic_pay or 0) + (account.hra or 0)) * (config.tds_percentage / 100.0))
        else:
            account.pf = 0.0
            account.tds = 0.0
            
    account.total_gross_salary = int(account.gross_salary - account.pf - account.tds)

    db.commit()
    db.refresh(account)
    return account

# ── SECOND TAB: PLACEMENT RECORDS ───────────────────────────────

def list_placements(db: Session) -> List[dict]:
    """
    List joined placements from the Job Candidate mapping module.
    """
    mappings = db.query(JobCandidateMapping).filter(
        JobCandidateMapping.status == "Joined"
    ).all()
    
    placements = []
    for m in mappings:
        candidate = m.candidate
        job = m.job
        
        # Get organization details through Job
        org = None
        if job.organization_id:
            org = db.query(Organization).filter(Organization.id == job.organization_id).first()
            
        placements.append({
            "joining_date": m.joining_date,
            "candidate_code": candidate.candidate_code,
            "candidate_name": f"{candidate.first_name} {candidate.last_name}".strip(),
            "organization_id": org.organization_id if org else None,
            "organization_name": org.organization_name if org else job.company_name,
            "location": org.location if org else None,
            "job_designation": job.requirements[0].job_title if job.requirements else "—",
            "incentive": m.incentive,
            "rate_card": m.rate_card,
            "band": m.band
        })
    return placements

# ── FOURTH TAB: INVOICING & BILLING ────────────────────────────

def list_invoices(db: Session) -> List[dict]:
    """
    List and synchronize invoicing records for joined candidate placements.
    """
    mappings = db.query(JobCandidateMapping).filter(
        JobCandidateMapping.status == "Joined"
    ).all()
    
    invoices_list = []
    for m in mappings:
        candidate = m.candidate
        job = m.job
        org = None
        if job.organization_id:
            org = db.query(Organization).filter(Organization.id == job.organization_id).first()
            
        invoice = db.query(Invoice).filter(Invoice.job_candidate_mapping_id == m.id).first()
        
        offered_ctc_val = 0.0
        if m.salary_offered:
            try:
                clean_ctc = "".join(c for c in m.salary_offered if c.isdigit() or c == ".")
                if clean_ctc:
                    offered_ctc_val = float(clean_ctc)
            except ValueError:
                pass
                
        if not invoice:
            # Create a default database entry for the invoice
            invoice = Invoice(
                job_candidate_mapping_id=m.id,
                invoice_number=f"INV-{m.id}-{date.today().year}",
                invoice_date=date.today(),
                billable_ctc=offered_ctc_val,
                gross=0.0,
                cgst=org.cgst if org else 0.0,
                sgst=org.sgst if org else 0.0,
                igst=org.igst if org else 0.0,
                total_gst=0.0,
                billable_amount=0.0,
                tds_deduction=0.0,
                deduction=0.0,
                received_amount=0.0,
                balance_amount=0.0,
                received_date=None,
                status="Pending"
            )
            db.add(invoice)
            db.commit()
            db.refresh(invoice)
            
        # Compile response dictionary with candidate/organization details
        invoices_list.append({
            "id": invoice.id,
            "job_candidate_mapping_id": invoice.job_candidate_mapping_id,
            "invoice_number": invoice.invoice_number,
            "invoice_date": invoice.invoice_date,
            "billable_ctc": invoice.billable_ctc,
            "gross": invoice.gross,
            "cgst": invoice.cgst,
            "sgst": invoice.sgst,
            "igst": invoice.igst,
            "total_gst": invoice.total_gst,
            "billable_amount": invoice.billable_amount,
            "tds_deduction": invoice.tds_deduction,
            "deduction": invoice.deduction,
            "received_amount": invoice.received_amount,
            "balance_amount": invoice.balance_amount,
            "received_date": invoice.received_date,
            "status": invoice.status,
            
            # Read-only fields fetched from candidate placement and org
            "candidate_joined_date": m.joining_date,
            "candidate_name": f"{candidate.first_name} {candidate.last_name}".strip(),
            "job_designation": job.requirements[0].job_title if job.requirements else "—",
            "organization_name": org.organization_name if org else job.company_name,
            "location": org.location if org else None,
            "offered_ctc": offered_ctc_val,
            "gst_number": org.gst_number if org else None
        })
        
    return invoices_list

def update_invoice(db: Session, mapping_id: int, payload: InvoiceUpdate) -> Invoice:
    """
    Update details for a candidate placement's invoice.
    """
    invoice = db.query(Invoice).filter(Invoice.job_candidate_mapping_id == mapping_id).first()
    if not invoice:
        # Create dynamically if not found
        invoice = Invoice(job_candidate_mapping_id=mapping_id)
        db.add(invoice)
        
    update_data = payload.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(invoice, key, value)
        
    # Run dynamic calculations
    gross_val = invoice.gross or 0.0
    cgst_pct = invoice.cgst or 0.0
    sgst_pct = invoice.sgst or 0.0
    igst_pct = invoice.igst or 0.0
    
    cgst_amt = gross_val * (cgst_pct / 100.0)
    sgst_amt = gross_val * (sgst_pct / 100.0)
    igst_amt = gross_val * (igst_pct / 100.0)
    
    invoice.total_gst = cgst_amt + sgst_amt + igst_amt
    invoice.billable_amount = gross_val + invoice.total_gst
    
    tds = invoice.tds_deduction or 0.0
    ded = invoice.deduction or 0.0
    rec = invoice.received_amount or 0.0
    
    invoice.balance_amount = invoice.billable_amount - tds - ded - rec
    
    db.commit()
    db.refresh(invoice)
    return invoice

def get_invoice_by_mapping_id(db: Session, mapping_id: int) -> Optional[dict]:
    """
    Get and format a single invoice by its candidate mapping ID.
    """
    invoices = list_invoices(db)
    for inv in invoices:
        if inv["job_candidate_mapping_id"] == mapping_id:
            return inv
    return None
