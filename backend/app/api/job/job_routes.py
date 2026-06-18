from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.job import JobCreate, JobUpdate, JobResponse
from app.api.job.job_service import JobService
from app.core.exceptions import JobNotFoundError
from typing import List, Optional
from datetime import date

router = APIRouter(prefix="/jobs", tags=["Jobs"])

@router.post("/", response_model=JobResponse, status_code=201)
def create_job(job: JobCreate, db: Session = Depends(get_db)):
    return JobService.create_job(db, job)

@router.get("/", response_model=List[JobResponse])
def get_jobs(
    company_name: Optional[str] = Query(None),
    date: Optional[date] = Query(None),
    db: Session = Depends(get_db)
):
    return JobService.get_jobs(db, company_name, date)

@router.put("/{id}", response_model=JobResponse)
def update_job(id: int, job_update: JobUpdate, db: Session = Depends(get_db)):
    db_job = JobService.update_job(db, id, job_update)
    if not db_job:
        raise JobNotFoundError(job_id=id)
    return db_job
