from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

class CandidateCreateRequest(BaseModel):
    full_name: str = Field(..., min_length=1)
    phone_number: str = Field(..., min_length=1)
    email_address: str = Field(..., min_length=1)
    current_location: Optional[str] = None
    current_last_company: Optional[str] = None
    total_experience: Optional[str] = None
    relevant_experience_years: Optional[str] = None
    highest_education: Optional[str] = None
    skills: Optional[str] = None
    current_ctc: Optional[str] = None
    expected_ctc: Optional[str] = None
    notice_period: Optional[str] = None
    reason_for_job_change: Optional[str] = None
    resume_file_name: Optional[str] = None
    resume_file_path: Optional[str] = None

class CandidateResponse(BaseModel):
    id: int
    candidate_code: str
    full_name: str
    phone_number: str
    email_address: str
    current_location: Optional[str] = None
    current_last_company: Optional[str] = None
    total_experience: Optional[str] = None
    relevant_experience_years: Optional[str] = None
    highest_education: Optional[str] = None
    skills: Optional[str] = None
    current_ctc: Optional[str] = None
    expected_ctc: Optional[str] = None
    notice_period: Optional[str] = None
    reason_for_job_change: Optional[str] = None
    resume_file_name: Optional[str] = None
    resume_file_path: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    model_config = { "from_attributes": True }
