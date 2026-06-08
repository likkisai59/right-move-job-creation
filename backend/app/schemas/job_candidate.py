from pydantic import BaseModel, field_validator
from typing import Optional, List
from datetime import date, datetime
from enum import Enum

class PipelineStatus(str, Enum):
    SHORTLISTED = "Shortlisted"
    INTERVIEW_SELECTED = "Interview Selected"
    INTERVIEW_REJECTED = "Interview Rejected"
    CANDIDATE_APPROVED = "Candidate Approved"
    CANDIDATE_REJECTED = "Candidate Rejected"

class JoiningStatus(str, Enum):
    PENDING = "Pending"
    JOINED = "Joined"
    NOT_JOINED = "Not Joined"

class CandidateActionRequest(BaseModel):
    candidate_id: int

class SelectionDetailsUpdate(BaseModel):
    status: Optional[PipelineStatus] = None
    interview_date: Optional[date] = None
    approval_date: Optional[date] = None
    rejection_date: Optional[date] = None
    band: Optional[str] = None
    joining_status: Optional[JoiningStatus] = None
    joining_date: Optional[date] = None
    salary_offered: Optional[str] = None
    rate_card: Optional[str] = None
    incentive: Optional[str] = None
    recruiter_notes: Optional[str] = None
    tl_notes: Optional[str] = None
    client_feedback: Optional[str] = None

    @field_validator('salary_offered', 'rate_card', 'incentive')
    @classmethod
    def check_numeric(cls, v: Optional[str]) -> Optional[str]:
        if v is None or str(v).strip() == "":
            return None
        # Try converting to float to check if numeric, but preserve original string format in case they have "10.5" etc.
        # But wait, the requirement is "Must be numeric" and "Cannot be negative"
        try:
            val = float(v)
            if val < 0:
                raise ValueError("Value cannot be negative")
            return str(val)
        except ValueError as e:
            if "negative" in str(e):
                raise
            raise ValueError("Value must be numeric")

class SelectionDetailsResponse(BaseModel):
    id: int
    job_id: int
    candidate_id: int
    match_score: Optional[int] = None
    status: str
    interview_date: Optional[date] = None
    approval_date: Optional[date] = None
    rejection_date: Optional[date] = None
    band: Optional[str] = None
    matched_skills: Optional[str] = None
    missing_skills: Optional[str] = None
    joining_status: Optional[str] = None
    joining_date: Optional[date] = None
    salary_offered: Optional[str] = None
    rate_card: Optional[str] = None
    incentive: Optional[str] = None
    recruiter_notes: Optional[str] = None
    tl_notes: Optional[str] = None
    client_feedback: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    updated_by: Optional[int] = None
    last_status_changed_at: Optional[datetime] = None
    last_status_changed_by: Optional[int] = None
    
    # Extended job info
    organization_name: Optional[str] = None
    job_title: Optional[str] = None
    job_description: Optional[str] = None
    business_unit: Optional[str] = None
    hiring_manager: Optional[str] = None
    
    model_config = {"from_attributes": True}
