from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, UniqueConstraint, func, Text, Date
from sqlalchemy.orm import relationship
from app.core.database import Base

class JobCandidateMapping(Base):
    """
    Mapping table to track which candidates are shortlisted for which jobs.
    """
    __tablename__ = "job_candidate_mapping"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    job_id = Column(Integer, ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False)
    candidate_id = Column(Integer, ForeignKey("candidates.id", ondelete="CASCADE"), nullable=False)
    match_score = Column(Integer, nullable=True, default=0)
    status = Column(String(50), nullable=False, default="Shortlisted")
    
    # Matching Details
    matched_skills = Column(Text, nullable=True) # JSON list
    missing_skills = Column(Text, nullable=True) # JSON list
    
    # Selection Workflow Details
    interview_date = Column(Date, nullable=True)
    approval_date = Column(Date, nullable=True)
    rejection_date = Column(Date, nullable=True)
    band = Column(String(50), nullable=True)
    
    # Joining Information
    joining_status = Column(String(50), nullable=True, default="Pending") # Pending, Joined, Not Joined
    joining_date = Column(Date, nullable=True)
    
    # Commercial Details
    salary_offered = Column(String(100), nullable=True)
    rate_card = Column(String(100), nullable=True) # Admin only
    incentive = Column(String(100), nullable=True) # TL only
    
    # Remarks
    recruiter_notes = Column(Text, nullable=True)
    tl_notes = Column(Text, nullable=True)
    client_feedback = Column(Text, nullable=True)
    
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())
    
    # Audit Trail
    updated_by = Column(Integer, nullable=True) # ID of user who last updated
    last_status_changed_at = Column(DateTime, nullable=True)
    last_status_changed_by = Column(Integer, nullable=True)

    # Ensure a candidate can only be mapped to a specific job once
    __table_args__ = (
        UniqueConstraint('job_id', 'candidate_id', name='_job_candidate_uc'),
    )

    # Relationships
    job = relationship("Job", backref="candidate_mappings")
    candidate = relationship("Candidate", backref="job_mappings")
