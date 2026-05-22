from sqlalchemy import Column, Integer, String, DateTime, Date, Float, Enum, func
from app.core.database import Base


class Employee(Base):
    """
    Represents an employee registered in the system.
    Table name: employees
    """
    __tablename__ = "employees"

    # Primary key — auto-incremented internal ID
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)

    # Auto-generated employee code e.g. EMP0001
    employee_id = Column(String(50), unique=True, nullable=False, index=True)

    # Personal details
    first_name= Column(String(255), nullable=False)
    last_name= Column(String(255), nullable=False)
    blood_group= Column(String(10), nullable=True)
    gender= Column(Enum('Male','Female','Other',name='gender'), nullable=False)
    country_code= Column(String(10), nullable=True)
    contact_number= Column(String(255), nullable=True)
    email= Column(String(255), nullable=True) 
    permanent_address= Column(String(255), nullable=True) 
    current_address= Column(String(255), nullable=True) 
    
    # Job details
    designation= Column(String(255), nullable=False)
    date_of_joining= Column(Date, nullable=False)
    package= Column(Float, nullable=True)        # Annual package (numeric)

    # Status: Active or Inactive
    status= Column(Enum('Active', 'Inactive', name='employee_status'), nullable=False, default="Active")

    # Only filled when employee leaves — nullable by default
    last_working_date= Column(Date, nullable=True)

    # Additional Personal & Verification details
    date_of_birth= Column(Date, nullable=True)
    contact_number_office= Column(String(255), nullable=True)
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
    bank_name= Column(String(255), nullable=False)
    bank_account_number= Column(String(255), nullable=False)
    bank_ifsc_code= Column(String(100), nullable=False)

    # Reporting & Compliance Details
    assigned_business_unit = Column(String(255), nullable=False)
    reporting_to = Column(String(255), nullable=False)
    work_mode = Column(String(255), nullable=False)
    ctc = Column(Float, nullable=False)
    compliance = Column(String(255), nullable=False)

    # Asset & System Configuration Details
    system_assigned = Column(String(50), nullable=False)
    sim_card_assigned = Column(String(50), nullable=False)
    email_id_configured = Column(String(50), nullable=False)
    linkedin_configured = Column(String(50), nullable=False)
    google_sheet_configured = Column(String(50), nullable=False)
    whatsapp_business_configured = Column(String(50), nullable=False)



