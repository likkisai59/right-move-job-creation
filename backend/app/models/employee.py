from sqlalchemy import Column, Integer, String, DateTime, Date, Float, Enum, func
from sqlalchemy.orm import relationship
from app.core.database import Base

class Employee(Base):
    """
    Represents an employee registered in the system.
    Table name: employees
    """
    __tablename__ = "employees"

    # Primary key — auto-incremented internal ID
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)

    # Auto-generated employee code e.g. RM0001
    employee_id = Column(String(50), unique=True, nullable=False, index=True)

    # Personal details
    first_name= Column(String(255), nullable=True)
    last_name= Column(String(255), nullable=True)
    blood_group= Column(String(10), nullable=True)
    gender= Column(Enum('Male','Female','Other',name='gender'), nullable=True)
    country_code= Column(String(10), nullable=True)
    contact_number= Column(String(255), nullable=True)
    email= Column(String(255), nullable=True) 
    permanent_address= Column(String(255), nullable=True) 
    current_address= Column(String(255), nullable=True) 
    
    # Job details
    designation= Column(String(255), nullable=True)
    date_of_joining= Column(Date, nullable=True)
    package= Column(Float, nullable=True)        # Annual package (numeric)

    # Status: Active or Inactive
    status= Column(Enum('Active', 'Inactive', name='employee_status'), nullable=False, default="Active")

    # Draft / Profile Status tracking
    profile_status= Column(Enum('Draft', 'In Progress', 'Completed', name='employee_profile_status'), nullable=False, default="Draft")
    completion_percentage = Column(Integer, nullable=False, default=0)

    # HR completion tracking
    profile_status_hr = Column(Enum('Draft', 'In Progress', 'Completed', name='employee_profile_status_hr'), nullable=False, default="Draft")
    completion_percentage_hr = Column(Integer, nullable=False, default=0)

    # ADMIN completion tracking
    profile_status_admin = Column(Enum('Draft', 'In Progress', 'Completed', name='employee_profile_status_admin'), nullable=False, default="Draft")
    completion_percentage_admin = Column(Integer, nullable=False, default=0)

    # Only filled when employee leaves — nullable by default
    last_working_date= Column(Date, nullable=True)

    # Date of Employee Creation
    date = Column(Date, nullable=True)

    # Relationships to the new Attendance module tables
    attendance_records = relationship("Attendance", back_populates="employee", cascade="all, delete-orphan")
    leave_records = relationship("Leave", back_populates="employee", cascade="all, delete-orphan")

    # Additional Personal & Verification details
    date_of_birth= Column(Date, nullable=True)
    countrycode_office_contact= Column(String(10), nullable=True)
    contact_number_office= Column(String(255), nullable=True)
    countrycode_emergency_contact= Column(String(10), nullable=True)
    emergency_contact_number= Column(String(255), nullable=True)
    aadhar_number= Column(String(255), nullable=True)
    aadhar_url= Column(String(255), nullable=True)
    pan_number= Column(String(255), nullable=True)
    pan_url= Column(String(255), nullable=True)
    marksheet_10th_url= Column(String(255), nullable=True)
    marksheet_12th_url= Column(String(255), nullable=True)
    marksheet_graduation_url= Column(String(255), nullable=True)
    present_address_proof_url= Column(String(255), nullable=True)
    permanent_address_proof_url= Column(String(255), nullable=True)
    photo_url= Column(String(255), nullable=True)
    medical_condition= Column(String(255), nullable=True)

    # Experience & Employment verification details
    resume_url= Column(String(255), nullable=True)
    salary_slips_url= Column(String(255), nullable=True)
    offer_letter_url= Column(String(255), nullable=True)
    last_company_name= Column(String(255), nullable=True)

    # Bank Details
    bank_name= Column(String(255), nullable=True)
    bank_account_number= Column(String(255), nullable=True)
    bank_ifsc_code= Column(String(100), nullable=True)

    # Reporting & Compliance Details
    assigned_business_unit = Column(String(255), nullable=True)
    reporting_to = Column(String(255), nullable=True)
    work_mode = Column(String(255), nullable=True)
    ctc = Column(Float, nullable=True)
    compliance = Column(String(255), nullable=True)

    # Asset & System Configuration Details
    system_assigned = Column(String(50), nullable=True)
    sim_card_assigned = Column(String(50), nullable=True)
    email_id_configured = Column(String(50), nullable=True)
    linkedin_configured = Column(String(50), nullable=True)
    google_sheet_configured = Column(String(50), nullable=True)
    whatsapp_business_configured = Column(String(50), nullable=True)

    # Generated login credentials
    employee_password = Column(String(255), nullable=True)
