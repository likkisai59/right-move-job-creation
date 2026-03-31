from datetime import date
from typing import List, Optional

from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from app.models.job_requirement import Job, JobRequirement
from app.schemas.job_requirement import JobCreateRequest, JobUpdateRequest


# ─────────────────────────────────────────────────────────────
# INTERNAL HELPER
# ─────────────────────────────────────────────────────────────

def generate_job_code(db: Session) -> str:
    """
    Auto-generates the next job code in the format JOB-0001.
    """
    max_id = db.query(func.max(Job.id)).scalar() or 0
    next_number = max_id + 1
    return f"JOB-{next_number:04d}"


# ─────────────────────────────────────────────────────────────
# CREATE
# ─────────────────────────────────────────────────────────────

def create_job_requirement(db: Session, payload: JobCreateRequest) -> Job:
    """
    Creates a new job with multiple requirements.
    """
    job_code = generate_job_code(db)

    new_job = Job(
        job_code=job_code,
        job_date=payload.job_date,
        company_name=payload.company_name,
        business_category=payload.business_category,
        assigned_to=payload.assigned_to,
        status=payload.status or "ACTIVE",
    )

    # Add requirements
    for req in payload.requirements:
        new_requirement = JobRequirement(
            job_title=req.job_title,
            budget=req.budget,
            experience=req.experience,
            num_candidates=req.num_candidates
        )
        new_job.requirements.append(new_requirement)

    db.add(new_job)
    db.commit()
    db.refresh(new_job)
    return new_job


# ─────────────────────────────────────────────────────────────
# LIST
# ─────────────────────────────────────────────────────────────

def get_all_jobs(
    db: Session,
    search: Optional[str] = None,
    company_name: Optional[str] = None,
    job_date: Optional[date] = None,
    business_category: Optional[str] = None,
) -> List[Job]:
    """
    Returns all jobs with their requirements.
    """
    query = db.query(Job)

    if search:
        search_term = f"%{search.strip()}%"
        # Since job_title moved to JobRequirement, we need to join for search.
        query = query.join(JobRequirement).filter(
            or_(
                Job.company_name.ilike(search_term),
                JobRequirement.job_title.ilike(search_term)
            )
        ).distinct()

    if company_name:
        query = query.filter(
            Job.company_name.ilike(f"%{company_name.strip()}%")
        )

    if job_date:
        query = query.filter(Job.job_date == job_date)

    if business_category and business_category.upper() != "ALL":
        query = query.filter(Job.business_category == business_category.upper())

    return query.order_by(Job.created_at.desc()).all()


# ─────────────────────────────────────────────────────────────
# GET BY ID
# ─────────────────────────────────────────────────────────────

def get_job_by_id(db: Session, job_id: int) -> Optional[Job]:
    """
    Fetches a single job by its ID.
    """
    return db.query(Job).filter(Job.id == job_id).first()


# ─────────────────────────────────────────────────────────────
# UPDATE
# ─────────────────────────────────────────────────────────────

def update_job(
    db: Session,
    job_id: int,
    payload: JobUpdateRequest,
) -> Optional[Job]:
    """
    Updates an existing job and its requirements.
    """
    job = db.query(Job).filter(Job.id == job_id).first()

    if job is None:
        return None

    # Apply parent fields
    job.job_date = payload.job_date
    job.company_name = payload.company_name
    job.business_category = payload.business_category
    job.assigned_to = payload.assigned_to
    job.status = payload.status or "ACTIVE"

    # Update requirements (replace existing ones)
    job.requirements = []
    
    # Add new requirements
    for req in payload.requirements:
        new_requirement = JobRequirement(
            job_title=req.job_title,
            budget=req.budget,
            experience=req.experience,
            num_candidates=req.num_candidates
        )
        job.requirements.append(new_requirement)

    db.commit()
    db.refresh(job)
    return job


