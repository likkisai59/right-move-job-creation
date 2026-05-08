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
    preferred_name= Column(String(255), nullable=True)   # What employee likes to be called 
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
