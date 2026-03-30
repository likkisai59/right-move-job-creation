from sqlalchemy import Column, Integer, String, DateTime, Text, func
from app.core.database import Base

class Candidate(Base):
    """
    Represents a candidate registered in the system.
    Table name: candidates
    """
    __tablename__ = "candidates"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    candidate_code = Column(String(50), unique=True, nullable=False, index=True)
    first_name = Column(String(255), nullable=False)
    last_name = Column(String(255), nullable=False)
    phone_number = Column(String(20), nullable=False)
    country_code = Column(String(10), nullable=False, default="+91")
    email_address = Column(String(255), nullable=False, unique=True)
    current_location = Column(String(255), nullable=True)
    current_last_company = Column(String(255), nullable=True)
    total_experience = Column(String(100), nullable=True)
    relevant_experience_years = Column(String(100), nullable=True)
    highest_education = Column(String(255), nullable=True)
    skills = Column(Text, nullable=True)
    current_ctc = Column(String(100), nullable=True)
    expected_ctc = Column(String(100), nullable=True)
    notice_period = Column(String(100), nullable=True)
    reason_for_job_change = Column(Text, nullable=True)
    resume_file_name = Column(String(255), nullable=True)
    resume_file_path = Column(String(500), nullable=True)
    resume_url = Column(String(255), nullable=True)

    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())
