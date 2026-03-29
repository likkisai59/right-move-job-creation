# schemas/job_requirement.py
# ─────────────────────────────────────────────────────────────
# Pydantic schemas for request validation and response shaping.
#
# JobCreateRequest  → validates incoming POST body
# JobUpdateRequest  → validates incoming PUT body  [Task 2]
# JobResponse       → shapes a single job in API responses
# ─────────────────────────────────────────────────────────────

from datetime import date, datetime
from typing import Optional, List
from pydantic import BaseModel, Field, field_validator


# ─────────────────────────────────────────────────────────────
# Allowed status values (mirrors the DB enum)
# ─────────────────────────────────────────────────────────────
ALLOWED_STATUSES = {"ACTIVE", "ON_HOLD", "CLOSED", "DRAFT"}


# ─────────────────────────────────────────────────────────────
# REQUIREMENT SCHEMAS
# ─────────────────────────────────────────────────────────────
class RequirementCreate(BaseModel):
    job_title: str = Field(..., min_length=1, description="Title of the job position")
    budget: str = Field(..., min_length=1, description="Budget for the role, e.g. '18-22 LPA'")
    experience: str = Field(..., min_length=1, description="Required experience, e.g. '3-5 years'")
    num_candidates: int = Field(..., gt=0, description="Number of candidates needed (must be > 0)")

    @field_validator("job_title", "budget", "experience", mode="before")
    @classmethod
    def strip_fields(cls, v: str) -> str:
        if isinstance(v, str):
            return v.strip()
        return v

class RequirementResponse(BaseModel):
    id: int
    job_title: str
    budget: str
    experience: str
    num_candidates: int

    model_config = {
        "from_attributes": True
    }


# ─────────────────────────────────────────────────────────────
# REQUEST SCHEMA — POST /api/jobs
# ─────────────────────────────────────────────────────────────
class JobCreateRequest(BaseModel):
    job_date: date = Field(..., description="Date of the job requirement (YYYY-MM-DD)")
    company_name: str = Field(..., min_length=1, description="Name of the hiring company")
    requirements: List[RequirementCreate] = Field(..., min_length=1, description="List of hiring requirements")
    assigned_to: str = Field(..., min_length=1, description="Name of the assigned recruiter")
    status: Optional[str] = Field(default="ACTIVE", description="Status: ACTIVE | ON_HOLD | CLOSED | DRAFT")

    @field_validator("company_name", "assigned_to", mode="before")
    @classmethod
    def strip_strings(cls, v: str) -> str:
        """Remove leading/trailing whitespace from all string fields."""
        if isinstance(v, str):
            return v.strip()
        return v

    @field_validator("status", mode="before")
    @classmethod
    def validate_status(cls, v: str) -> str:
        """Normalize status to uppercase and validate against allowed values."""
        if v is None:
            return "ACTIVE"
        normalized = str(v).strip().upper()
        if normalized not in ALLOWED_STATUSES:
            raise ValueError(
                f"Invalid status '{v}'. Allowed values: {', '.join(sorted(ALLOWED_STATUSES))}"
            )
        return normalized

    model_config = {
        "json_schema_extra": {
            "example": {
                "job_date": "2026-03-28",
                "company_name": "Microsoft",
                "requirements": [
                    { "job_title": "Software Engineer", "budget": "18-22 LPA", "experience": "5 years", "num_candidates": 10 },
                    { "job_title": "Full Stack Dev", "budget": "15-20 LPA", "experience": "2 years", "num_candidates": 5 }
                ],
                "assigned_to": "Priya Sharma",
                "status": "ACTIVE",
            }
        }
    }


# ─────────────────────────────────────────────────────────────
# UPDATE REQUEST SCHEMA — PUT /api/jobs/{id}
# ─────────────────────────────────────────────────────────────
class JobUpdateRequest(BaseModel):
    job_date: date = Field(..., description="Date of the job requirement (YYYY-MM-DD)")
    company_name: str = Field(..., min_length=1, description="Name of the hiring company")
    requirements: List[RequirementCreate] = Field(..., min_length=1, description="List of hiring requirements")
    assigned_to: str = Field(..., min_length=1, description="Name of the assigned recruiter")
    status: Optional[str] = Field(default="ACTIVE", description="Status: ACTIVE | ON_HOLD | CLOSED | DRAFT")

    @field_validator("company_name", "assigned_to", mode="before")
    @classmethod
    def strip_strings(cls, v: str) -> str:
        if isinstance(v, str):
            return v.strip()
        return v

    @field_validator("status", mode="before")
    @classmethod
    def validate_status(cls, v: str) -> str:
        if v is None:
            return "ACTIVE"
        normalized = str(v).strip().upper()
        if normalized not in ALLOWED_STATUSES:
            raise ValueError(
                f"Invalid status '{v}'. Allowed values: {', '.join(sorted(ALLOWED_STATUSES))}"
            )
        return normalized


# ─────────────────────────────────────────────────────────────
# RESPONSE SCHEMA
# Single job record — used for POST, GET by id, and PUT.
# ─────────────────────────────────────────────────────────────
class JobResponse(BaseModel):
    id: int
    job_code: str
    job_date: date
    company_name: str
    requirements: List[RequirementResponse]
    assigned_to: str
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True
    }


