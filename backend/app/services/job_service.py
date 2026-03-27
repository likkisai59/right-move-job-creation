# services/job_service.py
# ─────────────────────────────────────────────────────────────
# Business logic layer for job requirements.
#
# The route layer only calls this service.
# All DB operations and business rules live here — keeps
# routes thin and logic testable.
#
# Functions:
#   generate_job_code     → internal helper, called by create
#   create_job_requirement → Task 1: POST /api/jobs
#   get_all_jobs          → Task 2: GET  /api/jobs
#   get_job_by_id         → Task 2: GET  /api/jobs/{id}
#   update_job            → Task 2: PUT  /api/jobs/{id}
# ─────────────────────────────────────────────────────────────

from datetime import date
from typing import List, Optional

from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from app.models.job_requirement import JobRequirement
from app.schemas.job_requirement import JobCreateRequest, JobUpdateRequest


# ─────────────────────────────────────────────────────────────
# INTERNAL HELPER
# ─────────────────────────────────────────────────────────────

def generate_job_code(db: Session) -> str:
    """
    Auto-generates the next job code in the format JOB-0001.

    Strategy:
      - Uses MAX(id) + 1 so codes are always monotonically increasing
        and never collide even if records are deleted.
      - Falls back to 1 when the table is empty.
      - Pads the sequence number to 4 digits (e.g. JOB-0001).
    """
    max_id = db.query(func.max(JobRequirement.id)).scalar() or 0
    next_number = max_id + 1
    return f"JOB-{next_number:04d}"


# ─────────────────────────────────────────────────────────────
# TASK 1: CREATE
# ─────────────────────────────────────────────────────────────

def create_job_requirement(db: Session, payload: JobCreateRequest) -> JobRequirement:
    """
    Creates a new job requirement record in the database.

    Steps:
      1. Generate a unique job code.
      2. Build the ORM model instance from the validated payload.
      3. Add to session, commit, and refresh to load DB-generated fields
         (id, created_at, updated_at).
      4. Return the saved record.
    """
    job_code = generate_job_code(db)

    new_job = JobRequirement(
        job_code=job_code,
        job_date=payload.job_date,
        company_name=payload.company_name,
        job_title=payload.job_title,
        candidates_required=payload.candidates_required,
        experience_required=payload.experience_required,
        budgeted_package=payload.budgeted_package,
        assigned_recruiter=payload.assigned_recruiter,
        status=payload.status or "ACTIVE",
    )

    db.add(new_job)
    db.commit()
    db.refresh(new_job)
    return new_job


# ─────────────────────────────────────────────────────────────
# TASK 2: LIST
# ─────────────────────────────────────────────────────────────

def get_all_jobs(
    db: Session,
    search: Optional[str] = None,
    company_name: Optional[str] = None,
    job_date: Optional[date] = None,
) -> List[JobRequirement]:
    """
    Returns all job requirements, with optional filtering.

    Filters:
      - company_name : case-insensitive partial match on company_name
      - job_date     : exact match on job_date (YYYY-MM-DD)
      - Both filters can be combined.
      - No filters → returns all jobs ordered by created_at DESC.

    Args:
        db           : Active SQLAlchemy session.
        company_name : Optional partial company name to filter by.
        job_date     : Optional exact date to filter by.

    Returns:
        List of JobRequirement ORM instances.
    """
    query = db.query(JobRequirement)

    if search:
        search_term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                JobRequirement.company_name.ilike(search_term),
                JobRequirement.job_title.ilike(search_term)
            )
        )

    if company_name:
        # ilike performs a case-insensitive LIKE search
        query = query.filter(
            JobRequirement.company_name.ilike(f"%{company_name.strip()}%")
        )

    if job_date:
        query = query.filter(JobRequirement.job_date == job_date)

    return query.order_by(JobRequirement.created_at.desc()).all()


# ─────────────────────────────────────────────────────────────
# TASK 2: GET BY ID
# ─────────────────────────────────────────────────────────────

def get_job_by_id(db: Session, job_id: int) -> Optional[JobRequirement]:
    """
    Fetches a single job requirement by its primary key.

    Returns None if no record with that id exists.
    The route layer is responsible for returning a 404 in that case.

    Args:
        db     : Active SQLAlchemy session.
        job_id : Primary key of the job_requirements row.

    Returns:
        JobRequirement ORM instance, or None.
    """
    return db.query(JobRequirement).filter(JobRequirement.id == job_id).first()


# ─────────────────────────────────────────────────────────────
# TASK 2: UPDATE
# ─────────────────────────────────────────────────────────────

def update_job(
    db: Session,
    job_id: int,
    payload: JobUpdateRequest,
) -> Optional[JobRequirement]:
    """
    Updates an existing job requirement.

    Steps:
      1. Fetch the record — return None if not found (route gives 404).
      2. Apply all validated fields from the payload to the ORM object.
      3. Commit the transaction and refresh to get the updated timestamps.
      4. Return the updated record.

    Note: job_code is intentionally NOT updated — it is a permanent
    business key assigned at creation and must never change.

    Args:
        db      : Active SQLAlchemy session.
        job_id  : Primary key of the record to update.
        payload : Validated update data from the Pydantic schema.

    Returns:
        Updated JobRequirement ORM instance, or None if not found.
    """
    job = db.query(JobRequirement).filter(JobRequirement.id == job_id).first()

    if job is None:
        return None

    # Apply all updatable fields
    job.job_date = payload.job_date
    job.company_name = payload.company_name
    job.job_title = payload.job_title
    job.candidates_required = payload.candidates_required
    job.experience_required = payload.experience_required
    job.budgeted_package = payload.budgeted_package
    job.assigned_recruiter = payload.assigned_recruiter
    job.status = payload.status or "ACTIVE"

    db.commit()
    db.refresh(job)
    return job
