from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

class CandidateCreateRequest(BaseModel):
    full_name: str = Field(..., min_length=1)
    phone_number: str = Field(..., min_length=1)
    email_address: str = Field(..., min_length=1)
    current_location: str = Field(..., min_length=1)
    current_last_company: str = Field(..., min_length=1)
    total_experience: str = Field(..., min_length=1)
    relevant_experience_years: str = Field(..., min_length=1)
    highest_education: str = Field(..., min_length=1)
    skills: str = Field(..., min_length=1)
    current_ctc: str = Field(..., min_length=1)
    expected_ctc: str = Field(..., min_length=1)
    notice_period: str = Field(..., min_length=1)
    reason_for_job_change: Optional[str] = None
    resume_file_name: Optional[str] = None
    resume_file_path: Optional[str] = None

class CandidateResponse(BaseModel):
    id: int
    candidate_code: str
    full_name: str
    phone_number: str
    email_address: str
    current_location: str
    current_last_company: str
    total_experience: str
    relevant_experience_years: str
    highest_education: str
    skills: str
    current_ctc: str
    expected_ctc: str
    notice_period: str
    reason_for_job_change: Optional[str] = None
    resume_file_name: Optional[str] = None
    resume_file_path: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    model_config = { "from_attributes": True }
