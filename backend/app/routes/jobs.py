# routes/jobs.py
# ─────────────────────────────────────────────────────────────
# FastAPI router for job requirement endpoints.
#
# Currently implements:
#   POST /api/jobs        →  Create a new job requirement
#   GET  /api/jobs        →  List jobs with optional filters
#   GET  /api/jobs/{id}   →  Fetch a single job
#   PUT  /api/jobs/{id}   →  Update a single job
#
# Pattern:
#   Route validates HTTP layer → calls service → returns response
# ─────────────────────────────────────────────────────────────

from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, status, Query
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError

from app.core.database import get_db
from app.schemas.job_requirement import (
    JobCreateRequest,
    JobUpdateRequest,
    JobResponse,
)
from app.services.job_service import (
    create_job_requirement,
    get_all_jobs,
    get_job_by_id,
    update_job,
)
from app.utils.response import success_response, error_response

# Router will be mounted at /api/jobs in main.py
router = APIRouter(
    prefix="/api/jobs",
    tags=["Job Requirements"],
)


# ── POST /api/jobs ────────────────────────────────────────────

@router.post(
    "",
    summary="Create Job Requirement",
    description="Creates a new job requirement and stores it in the database.",
    status_code=status.HTTP_201_CREATED,
)
def create_job(
    payload: JobCreateRequest,       # Pydantic validates the request body
    db: Session = Depends(get_db),   # SQLAlchemy session injected automatically
):
    """
    POST /api/jobs

    Accepts job requirement details, validates them, stores in MySQL,
    and returns the created record with auto-generated job code.
    """
    try:
        # Delegate all business logic to the service layer
        created_job = create_job_requirement(db=db, payload=payload)

        # Convert ORM object → Pydantic schema → JSON-safe dict
        job_data = JobResponse.model_validate(created_job).model_dump(mode="json")

        return JSONResponse(
            status_code=status.HTTP_201_CREATED,
            content=success_response(
                message="Job requirement created successfully",
                data=job_data,
            ),
        )

    except SQLAlchemyError as db_error:
        db.rollback()
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=error_response(
                message="Database error while creating job requirement",
                errors=[{"field": "database", "message": str(db_error)}],
            ),
        )
    except Exception as exc:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=error_response(
                message="An unexpected error occurred",
                errors=[{"field": "server", "message": str(exc)}],
            ),
        )


# ── GET /api/jobs ─────────────────────────────────────────────

@router.get(
    "",
    summary="Get All Job Requirements",
    description="Fetches all job requirements with optional filtering.",
    status_code=status.HTTP_200_OK,
)
def list_jobs(
    search: Optional[str] = Query(None, description="General search on company name or job title"),
    company_name: Optional[str] = Query(None, description="Partial matching on company name"),
    job_date: Optional[date] = Query(None, description="Exact matching on YYYY-MM-DD"),
    business_category: Optional[str] = Query(None, description="Filter by IT, ITSM, BPO"),
    db: Session = Depends(get_db),
):
    """
    GET /api/jobs
    GET /api/jobs?company_name=Infosys&job_date=2026-03-15
    """
    try:
        jobs_orm = get_all_jobs(
            db=db, 
            search=search, 
            company_name=company_name, 
            job_date=job_date,
            business_category=business_category
        )

        # Convert list of ORM objects → list of JSON-safe dicts
        # Pydantic v2 TypeAdapter or list comprehension
        jobs_data = [
            JobResponse.model_validate(job).model_dump(mode="json")
            for job in jobs_orm
        ]

        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content=success_response(
                message="Jobs fetched successfully",
                data=jobs_data,
            ),
        )
    except Exception as exc:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=error_response(
                message="An unexpected error occurred while fetching jobs",
                errors=[{"field": "server", "message": str(exc)}],
            ),
        )


# ── GET /api/jobs/{id} ────────────────────────────────────────

@router.get(
    "/{job_id}",
    summary="Get Job Requirement by ID",
    description="Fetches a single job requirement by its database ID.",
    status_code=status.HTTP_200_OK,
)
def get_job(
    job_id: int,
    db: Session = Depends(get_db),
):
    """
    GET /api/jobs/{id}
    """
    try:
        job_orm = get_job_by_id(db=db, job_id=job_id)

        if not job_orm:
            return JSONResponse(
                status_code=status.HTTP_404_NOT_FOUND,
                content=error_response(message="Job requirement not found"),
            )

        job_data = JobResponse.model_validate(job_orm).model_dump(mode="json")

        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content=success_response(
                message="Job fetched successfully",
                data=job_data,
            ),
        )
    except Exception as exc:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=error_response(
                message="An unexpected error occurred",
                errors=[{"field": "server", "message": str(exc)}],
            ),
        )


# ── PUT /api/jobs/{id} ────────────────────────────────────────

@router.put(
    "/{job_id}",
    summary="Update Job Requirement",
    description="Updates an existing job requirement.",
    status_code=status.HTTP_200_OK,
)
def update_job_endpoint(
    job_id: int,
    payload: JobUpdateRequest,
    db: Session = Depends(get_db),
):
    """
    PUT /api/jobs/{id}
    """
    try:
        updated_job = update_job(db=db, job_id=job_id, payload=payload)

        if not updated_job:
            return JSONResponse(
                status_code=status.HTTP_404_NOT_FOUND,
                content=error_response(message="Job requirement not found"),
            )

        job_data = JobResponse.model_validate(updated_job).model_dump(mode="json")

        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content=success_response(
                message="Job requirement updated successfully",
                data=job_data,
            ),
        )

    except SQLAlchemyError as db_error:
        db.rollback()
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=error_response(
                message="Database error while updating job requirement",
                errors=[{"field": "database", "message": str(db_error)}],
            ),
        )
    except Exception as exc:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=error_response(
                message="An unexpected error occurred",
                errors=[{"field": "server", "message": str(exc)}],
            ),
        )
