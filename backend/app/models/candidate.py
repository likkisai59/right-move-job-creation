from sqlalchemy import Column, Integer, String, DateTime, Text, Date, func
from app.core.database import Base

class Candidate(Base):
    """
    Represents a candidate registered in the system.
    Table name: candidates
    """
    __tablename__ = "candidates"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    candidate_code = Column(String(50), unique=True, nullable=False, index=True)
    profile_status = Column(String(50), nullable=False, default="Active") # Draft, Active, Archived

    # ── Personal Details ───────────────────────────────────
    first_name = Column(String(255), nullable=False)
    last_name = Column(String(255), nullable=False)
    email_address = Column(String(255), nullable=False, unique=True)
    alternative_email = Column(String(255), nullable=True)
    phone_number = Column(String(20), nullable=False)
    country_code = Column(String(10), nullable=False, default="+91")
    alternative_contact_number = Column(String(20), nullable=True)
    current_location = Column(String(255), nullable=True)
    highest_qualification = Column(String(255), nullable=True)

    # ── Employee Details ───────────────────────────────────
    business_unit = Column(String(50), nullable=False, default="IT")
    current_last_company = Column(String(255), nullable=True)
    current_designation = Column(String(255), nullable=True)
    total_experience = Column(String(100), nullable=True)
    relevant_experience_years = Column(String(100), nullable=True)
    relevant_experience_by_skill = Column(Text, nullable=True)
    skills = Column(Text, nullable=True)
    notice_period = Column(String(100), nullable=True)
    lwd = Column(Date, nullable=True)                              # Last Working Day (conditional)
    employment_location = Column(String(255), nullable=True)
    current_ctc = Column(String(100), nullable=True)
    fixed_ctc = Column(String(100), nullable=True)
    variable_ctc = Column(String(100), nullable=True)             # Auto-calculated: current_ctc - fixed_ctc
    expected_ctc = Column(String(100), nullable=True)
    reason_for_job_change = Column(Text, nullable=True)
    source = Column(String(100), nullable=True)
    comments = Column(Text, nullable=True)
    recruiter_name = Column(String(255), nullable=True)

    # ── Misc ───────────────────────────────────────────────
    mapped_job_id = Column(Integer, nullable=True)
    resume_file_name = Column(String(255), nullable=True)
    resume_file_path = Column(String(500), nullable=True)
    resume_url = Column(String(255), nullable=True)

    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())
