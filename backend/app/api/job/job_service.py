from sqlalchemy.orm import Session
from app.models.job import Job
from app.schemas.job import JobCreate, JobUpdate
from typing import Optional
from datetime import date

class JobService:
    @staticmethod
    def create_job(db: Session, job: JobCreate) -> Job:
        db_job = Job(**job.model_dump())
        db.add(db_job)
        db.commit()
        db.refresh(db_job)
        return db_job

    @staticmethod
    def get_jobs(db: Session, company_name: Optional[str] = None, job_date: Optional[date] = None):
        query = db.query(Job)
        if company_name:
            query = query.filter(Job.company_name.contains(company_name))
        if job_date:
            query = query.filter(Job.date == job_date)
        return query.all()

    @staticmethod
    def update_job(db: Session, job_id: int, job_update: JobUpdate) -> Optional[Job]:
        db_job = db.query(Job).filter(Job.id == job_id).first()
        if not db_job:
            return None
        update_data = job_update.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_job, key, value)
        db.commit()
        db.refresh(db_job)
        return db_job
