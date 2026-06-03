from datetime import date, datetime
from typing import Optional, List
from pydantic import BaseModel, Field, field_validator, model_validator
import re

# ── Allowed enum values ───────────────────────────────────────────────────
VALID_BUSINESS_UNITS = {"IT", "ITES", "BPO", "Lateral", "FLP", "F&A"}
VALID_SOURCES = {"Naukri", "LinkedIn", "Monster", "Shine", "Referral"}
VALID_NOTICE_PERIODS = {
    "Immediate", "Currently Serving",
    "30 Days", "45 Days", "60 Days", "90 Days",
}

class CandidateCreateRequest(BaseModel):
    # ── Personal Details ──────────────────────────────────
    first_name: str = Field(..., min_length=1)
    last_name: str = Field(..., min_length=1)
    email_address: str = Field(..., min_length=1)
    alternative_email: Optional[str] = None
    phone_number: str = Field(..., min_length=1)
    country_code: str = Field("+91", min_length=1)
    alternative_contact_number: Optional[str] = None
    current_location: Optional[str] = None
    highest_qualification: Optional[str] = None
    profile_status: Optional[str] = "Active"

    # ── Employee Details ──────────────────────────────────
    business_unit: str = Field(default="IT", description="Options: IT, ITES, BPO, Lateral, FLP, F&A")
    current_last_company: Optional[str] = None
    current_designation: Optional[str] = None
    total_experience: Optional[str] = None
    relevant_experience_years: Optional[str] = None
    relevant_experience_by_skill: Optional[str] = None
    skills: Optional[str] = None
    notice_period: Optional[str] = None
    lwd: Optional[date] = None
    employment_location: Optional[str] = None
    current_ctc: Optional[str] = None
    fixed_ctc: Optional[str] = None
    variable_ctc: Optional[str] = None
    expected_ctc: Optional[str] = None
    reason_for_job_change: Optional[str] = None
    source: Optional[str] = None
    comments: Optional[str] = None
    recruiter_name: Optional[str] = None

    # ── Misc ─────────────────────────────────────────────
    mapped_job_id: Optional[int] = None
    resume_file_name: Optional[str] = None
    resume_file_path: Optional[str] = None
    resume_url: Optional[str] = None

    @field_validator('first_name', 'last_name')
    @classmethod
    def validate_name(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Name cannot be empty")
        if not re.match(r"^[A-Za-z ]+$", v):
            raise ValueError("Name should contain only alphabets")
        return v

    @field_validator('email_address')
    @classmethod
    def validate_email(cls, v: str) -> str:
        v = v.strip()
        if not re.match(r"^[^\s@]+@[^\s@]+\.[^\s@]+$", v):
            raise ValueError("Enter a valid email address")
        return v

    @field_validator('alternative_email')
    @classmethod
    def validate_alternative_email(cls, v: Optional[str]) -> Optional[str]:
        if v:
            v = v.strip()
            if v and not re.match(r"^[^\s@]+@[^\s@]+\.[^\s@]+$", v):
                raise ValueError("Enter a valid alternative email address")
        return v or None

    @field_validator('phone_number')
    @classmethod
    def validate_phone(cls, v: str) -> str:
        v = v.strip()
        if not re.match(r"^[0-9]{8,15}$", v):
            raise ValueError("Phone number must be 8-15 digits")
        return v

    @field_validator('alternative_contact_number')
    @classmethod
    def validate_alt_phone(cls, v: Optional[str]) -> Optional[str]:
        if v:
            v = v.strip()
            if v and not re.match(r"^[0-9]{8,15}$", v):
                raise ValueError("Alternative contact number must be 8-15 digits")
        return v or None

    @field_validator('business_unit')
    @classmethod
    def validate_business_unit(cls, v: str) -> str:
        if v and v not in VALID_BUSINESS_UNITS:
            raise ValueError(f"Business unit must be one of: {', '.join(sorted(VALID_BUSINESS_UNITS))}")
        return v

    @field_validator('source')
    @classmethod
    def validate_source(cls, v: Optional[str]) -> Optional[str]:
        if v and v not in VALID_SOURCES:
            raise ValueError(f"Source must be one of: {', '.join(sorted(VALID_SOURCES))}")
        return v

    @field_validator('notice_period')
    @classmethod
    def validate_notice_period(cls, v: Optional[str]) -> Optional[str]:
        if v and v not in VALID_NOTICE_PERIODS:
            raise ValueError(f"Notice period must be one of: {', '.join(sorted(VALID_NOTICE_PERIODS))}")
        return v

    @model_validator(mode='after')
    def validate_fresher_experience(self) -> 'CandidateCreateRequest':
        total_exp = self.total_experience
        relevant_exp = self.relevant_experience_years

        if total_exp == 'fresher':
            if relevant_exp:
                try:
                    if float(relevant_exp) > 0:
                        raise ValueError("Freshers cannot have relevant experience")
                except ValueError as e:
                    if "Freshers cannot have relevant experience" in str(e):
                        raise e
                except TypeError:
                    pass
        return self


class CandidateUpdateRequest(BaseModel):
    """All fields optional for partial updates."""
    # Personal Details
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email_address: Optional[str] = None
    alternative_email: Optional[str] = None
    phone_number: Optional[str] = None
    country_code: Optional[str] = None
    alternative_contact_number: Optional[str] = None
    current_location: Optional[str] = None
    highest_qualification: Optional[str] = None
    profile_status: Optional[str] = None
    # Employee Details
    business_unit: Optional[str] = None
    current_last_company: Optional[str] = None
    current_designation: Optional[str] = None
    total_experience: Optional[str] = None
    relevant_experience_years: Optional[str] = None
    relevant_experience_by_skill: Optional[str] = None
    skills: Optional[str] = None
    notice_period: Optional[str] = None
    lwd: Optional[date] = None
    employment_location: Optional[str] = None
    current_ctc: Optional[str] = None
    fixed_ctc: Optional[str] = None
    variable_ctc: Optional[str] = None
    expected_ctc: Optional[str] = None
    reason_for_job_change: Optional[str] = None
    source: Optional[str] = None
    comments: Optional[str] = None
    recruiter_name: Optional[str] = None
    # Misc
    mapped_job_id: Optional[int] = None
    resume_file_name: Optional[str] = None
    resume_file_path: Optional[str] = None
    resume_url: Optional[str] = None
    updated_by: Optional[str] = None   # For edit history


class EditHistoryItem(BaseModel):
    id: int
    candidate_id: int
    updated_by: Optional[str] = None
    updated_at: datetime
    changed_fields: Optional[str] = None
    previous_values: Optional[str] = None
    new_values: Optional[str] = None

    model_config = {"from_attributes": True}


class CandidateResponse(BaseModel):
    id: int
    candidate_code: str
    profile_status: str

    # Personal Details
    first_name: str
    last_name: str
    country_code: str
    email_address: str
    alternative_email: Optional[str] = None
    phone_number: str
    alternative_contact_number: Optional[str] = None
    current_location: Optional[str] = None
    highest_qualification: Optional[str] = None

    # Employee Details
    business_unit: str
    current_last_company: Optional[str] = None
    current_designation: Optional[str] = None
    total_experience: Optional[str] = None
    relevant_experience_years: Optional[str] = None
    relevant_experience_by_skill: Optional[str] = None
    skills: Optional[str] = None
    notice_period: Optional[str] = None
    lwd: Optional[date] = None
    employment_location: Optional[str] = None
    current_ctc: Optional[str] = None
    fixed_ctc: Optional[str] = None
    variable_ctc: Optional[str] = None
    expected_ctc: Optional[str] = None
    reason_for_job_change: Optional[str] = None
    source: Optional[str] = None
    comments: Optional[str] = None
    recruiter_name: Optional[str] = None

    # Misc
    mapped_job_id: Optional[int] = None
    resume_file_name: Optional[str] = None
    resume_file_path: Optional[str] = None
    resume_url: Optional[str] = None

    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
