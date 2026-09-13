from pydantic import BaseModel
from datetime import date, datetime
from typing import Optional

class JobBase(BaseModel):
    date: date
    company_name: str
    job_title: str
    num_candidates: int = 0
    experience: float
    budget: float
    internal_spoc: Optional[str] = None

class JobCreate(JobBase): pass

class JobUpdate(BaseModel):
    date: Optional[date] = None
    company_name: Optional[str] = None
    job_title: Optional[str] = None
    num_candidates: Optional[int] = None
    experience: Optional[float] = None
    budget: Optional[float] = None
    internal_spoc: Optional[str] = None

class JobResponse(JobBase):
    id: int
    created_at: datetime
    model_config = {
        "from_attributes": True
    }
