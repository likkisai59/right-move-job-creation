from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, UniqueConstraint, func
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
    status = Column(String(50), nullable=False, default="shortlisted")
    
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())

    # Ensure a candidate can only be mapped to a specific job once
    __table_args__ = (
        UniqueConstraint('job_id', 'candidate_id', name='_job_candidate_uc'),
    )

    # Relationships
    job = relationship("Job", backref="candidate_mappings")
    candidate = relationship("Candidate", backref="job_mappings")
