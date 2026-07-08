from sqlalchemy import Column, Integer, ForeignKey, Float, String, Date, DateTime, func
from sqlalchemy.orm import relationship
from app.core.database import Base

class Account(Base):
    """
    Represents an employee account/salary structure details.
    Table name: accounts
    """
    __tablename__ = "accounts"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="CASCADE"), nullable=False, unique=True)
    basic_pay = Column(Integer, default=0, nullable=False)
    hra = Column(Integer, default=0, nullable=False)
    loan_amount = Column(Integer, default=0, nullable=False)
    client_incentive = Column(Integer, default=0, nullable=False)
    deduction_amount = Column(Integer, default=0, nullable=False)
    
    # New Columns
    unpaid_leaves = Column(Float, default=0.0, nullable=False)
    unpaid_leave_amount = Column(Integer, default=0, nullable=False)
    net_payable_salary = Column(Integer, default=0, nullable=False)
    ctc_offered = Column(Integer, default=0, nullable=False)
    incentives = Column(Integer, default=0, nullable=False)
    candidate_incentives = Column(Integer, default=0, nullable=False)
    client_total = Column(Integer, default=0, nullable=False)
    total_net_payable_salary = Column(Integer, default=0, nullable=False)
    gross_salary = Column(Integer, default=0, nullable=False)
    pf = Column(Float, default=0.0, nullable=False)
    tds = Column(Float, default=0.0, nullable=False)
    additional_incentive = Column(Integer, default=0, nullable=False)
    incentive_deducted = Column(Integer, default=0, nullable=False)
    loan_deducted = Column(Integer, default=0, nullable=False)
    net_salary_pay = Column(Integer, default=0, nullable=False)
    calculated_basic_pay = Column(Integer, default=0, nullable=False)
    baseline_status = Column(Integer, default=0, nullable=False)

    # Relationship to Employee
    employee = relationship("Employee", backref="account", uselist=False)


class PayrollHistory(Base):
    """
    Table name: payroll_history
    Stores snapshots of calculated salaries when a month/cycle is closed.
    """
    __tablename__ = "payroll_history"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="CASCADE"), nullable=False)
    employee_name = Column(String(255), nullable=False)
    cycle_start_date = Column(Date, nullable=False)
    cycle_end_date = Column(Date, nullable=False)
    cycle_month_year = Column(String(50), nullable=False)
    basic_pay = Column(Integer, default=0, nullable=False)
    hra = Column(Integer, default=0, nullable=False)
    unpaid_leaves = Column(Float, default=0.0, nullable=False)
    unpaid_leave_amount = Column(Integer, default=0, nullable=False)
    pf = Column(Float, default=0.0, nullable=False)
    tds = Column(Float, default=0.0, nullable=False)
    incentives = Column(Integer, default=0, nullable=False)
    candidate_incentives = Column(Integer, default=0, nullable=False)
    additional_incentive = Column(Integer, default=0, nullable=False)
    client_incentive = Column(Integer, default=0, nullable=False)
    incentive_deducted = Column(Integer, default=0, nullable=False)
    loan_amount = Column(Integer, default=0, nullable=False)
    loan_deducted = Column(Integer, default=0, nullable=False)
    deduction_amount = Column(Integer, default=0, nullable=False)
    net_salary_pay = Column(Integer, default=0, nullable=False)
    exported_at = Column(DateTime, nullable=False, server_default=func.now())

    # Relationship to Employee
    employee = relationship("Employee", backref="payroll_histories")


class InvoiceHistory(Base):
    """
    Table name: invoice_history
    Stores snapshots of calculated invoices when a month/cycle is closed.
    """
    __tablename__ = "invoice_history"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    job_candidate_mapping_id = Column(Integer, nullable=False)
    candidate_name = Column(String(255), nullable=False)
    job_designation = Column(String(255), nullable=False)
    organization_name = Column(String(255), nullable=False)
    location = Column(String(255), nullable=True)
    offered_ctc = Column(Float, default=0.0, nullable=False)
    billable_ctc = Column(Float, default=0.0, nullable=False)
    invoice_number = Column(String(100), nullable=False)
    invoice_date = Column(Date, nullable=False)
    gst_number = Column(String(100), nullable=True)
    gross = Column(Float, default=0.0, nullable=False)
    cgst = Column(Float, default=0.0, nullable=False)
    sgst = Column(Float, default=0.0, nullable=False)
    igst = Column(Float, default=0.0, nullable=False)
    total_gst = Column(Float, default=0.0, nullable=False)
    billable_amount = Column(Float, default=0.0, nullable=False)
    tds_deduction = Column(Float, default=0.0, nullable=False)
    deduction = Column(Float, default=0.0, nullable=False)
    received_amount = Column(Float, default=0.0, nullable=False)
    balance_amount = Column(Float, default=0.0, nullable=False)
    received_date = Column(Date, nullable=True)
    candidate_status = Column(String(100), nullable=True)
    billing_status = Column(String(100), nullable=True)
    cycle_month_year = Column(String(50), nullable=False)
    exported_at = Column(DateTime, nullable=False, server_default=func.now())
