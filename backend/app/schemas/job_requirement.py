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
# REQUEST SCHEMA — POST /api/jobs
# ─────────────────────────────────────────────────────────────
class JobCreateRequest(BaseModel):
    job_date: date = Field(..., description="Date of the job requirement (YYYY-MM-DD)")
    company_name: str = Field(..., min_length=1, description="Name of the hiring company")
    job_title: str = Field(..., min_length=1, description="Title of the job position")
    candidates_required: int = Field(..., gt=0, description="Number of candidates needed (must be > 0)")
    experience_required: str = Field(..., min_length=1, description="Required experience, e.g. '3-5 years'")
    budgeted_package: str = Field(..., min_length=1, description="Budget for the role, e.g. '18-22 LPA'")
    assigned_recruiter: str = Field(..., min_length=1, description="Name of the assigned recruiter")
    status: Optional[str] = Field(default="ACTIVE", description="Status: ACTIVE | ON_HOLD | CLOSED | DRAFT")

    @field_validator("company_name", "job_title", "experience_required",
                     "budgeted_package", "assigned_recruiter", mode="before")
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
                "company_name": "Infosys Technologies",
                "job_title": "Senior React Developer",
                "candidates_required": 5,
                "experience_required": "4-6 years",
                "budgeted_package": "18-22 LPA",
                "assigned_recruiter": "Priya Sharma",
                "status": "ACTIVE",
            }
        }
    }


# ─────────────────────────────────────────────────────────────
# UPDATE REQUEST SCHEMA — PUT /api/jobs/{id}          [Task 2]
#
# All fields are required — a full replacement of all editable
# columns.  job_code is never editable (it is the business key).
# ─────────────────────────────────────────────────────────────
class JobUpdateRequest(BaseModel):
    job_date: date = Field(..., description="Date of the job requirement (YYYY-MM-DD)")
    company_name: str = Field(..., min_length=1, description="Name of the hiring company")
    job_title: str = Field(..., min_length=1, description="Title of the job position")
    candidates_required: int = Field(..., gt=0, description="Number of candidates needed (must be > 0)")
    experience_required: str = Field(..., min_length=1, description="Required experience, e.g. '3-5 years'")
    budgeted_package: str = Field(..., min_length=1, description="Budget for the role, e.g. '18-22 LPA'")
    assigned_recruiter: str = Field(..., min_length=1, description="Name of the assigned recruiter")
    status: Optional[str] = Field(default="ACTIVE", description="Status: ACTIVE | ON_HOLD | CLOSED | DRAFT")

    @field_validator("company_name", "job_title", "experience_required",
                     "budgeted_package", "assigned_recruiter", mode="before")
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

    model_config = {
        "json_schema_extra": {
            "example": {
                "job_date": "2026-03-18",
                "company_name": "Infosys Technologies",
                "job_title": "Lead React Developer",
                "candidates_required": 6,
                "experience_required": "5-7 years",
                "budgeted_package": "20-24 LPA",
                "assigned_recruiter": "Priya Sharma",
                "status": "ACTIVE",
            }
        }
    }


# ─────────────────────────────────────────────────────────────
# RESPONSE SCHEMA
# Single job record — used for POST, GET by id, and PUT.
# ─────────────────────────────────────────────────────────────
class JobResponse(BaseModel):
    id: int
    job_code: str
    job_date: date
    company_name: str
    job_title: str
    candidates_required: int
    experience_required: str
    budgeted_package: str
    assigned_recruiter: str
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = {
        # Allows Pydantic to read data directly from SQLAlchemy model attributes
        "from_attributes": True
    }
