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

import csv
import io
import os
import shutil
import logging
from datetime import date
from typing import Optional

logger = logging.getLogger(__name__)

import openpyxl
from fastapi import APIRouter, Depends, status, Query, File, UploadFile
from fastapi.responses import JSONResponse, StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError

from pydantic import BaseModel
from app.core.database import get_db
from app.schemas.candidate import CandidateResponse
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
    get_filtered_jobs_for_export,
    get_matching_candidates,
    shortlist_candidate,
    reject_candidate,
    get_shortlisted_candidates,
)
from app.schemas.job_candidate import CandidateActionRequest
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
        logger.error(f"Database error while creating job requirement: {db_error}", exc_info=True)
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=error_response(
                message="Database error while creating job requirement",
            ),
        )
    except Exception as exc:
        logger.error(f"POST /api/jobs ERROR: {exc}", exc_info=True)
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=error_response(
                message="An unexpected error occurred",
            ),
        )


# ── POST /api/jobs/upload ──────────────────────────────────────

@router.post(
    "/upload",
    summary="Upload Job Description Document",
    description="Uploads a job description file and returns its stored path.",
    status_code=status.HTTP_201_CREATED,
)
def upload_job_description(file: UploadFile = File(...)):
    try:
        from datetime import datetime
        filename = f"{int(datetime.now().timestamp())}_{file.filename}"
        
        # Ensure uploads directory exists
        os.makedirs("uploads", exist_ok=True)
        
        filepath = os.path.join("uploads", filename)
        with open(filepath, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        file_url = f"/uploads/{filename}"
        return JSONResponse(
            status_code=201, 
            content=success_response("File uploaded successfully", {"file_url": file_url})
        )
    except Exception as exc:
        logger.error(f"Error uploading job description: {exc}", exc_info=True)
        return JSONResponse(status_code=500, content=error_response("Failed to upload job description."))


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
    start_date: Optional[date] = Query(None, description="Filter jobs from this date (YYYY-MM-DD)"),
    end_date: Optional[date] = Query(None, description="Filter jobs up to this date (YYYY-MM-DD)"),
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by status: ACTIVE, CLOSED, ON_HOLD"),
    business_unit: Optional[str] = Query(None, description="Filter by IT, ITSM, BPO"),
    sort_by: Optional[str] = Query(None, description="Field to sort by"),
    sort_order: Optional[str] = Query("desc", description="Sort order (asc or desc)"),
    skip: int = Query(0, description="Pagination skip"),
    limit: int = Query(1000, description="Pagination limit"),
    db: Session = Depends(get_db),
):
    """
    GET /api/jobs
    GET /api/jobs?company_name=Infosys&start_date=2026-01-01&end_date=2026-03-31&status=ACTIVE
    """
    try:
        jobs_orm = get_all_jobs(
            db=db,
            search=search,
            company_name=company_name,
            start_date=start_date,
            end_date=end_date,
            status=status_filter,
            business_unit=business_unit,
            sort_by=sort_by,
            sort_order=sort_order,
            skip=skip,
            limit=limit
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
        logger.error(f"Error fetching jobs: {exc}", exc_info=True)
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=error_response(
                message="An unexpected error occurred while fetching jobs",
            ),
        )


# ── GET /api/jobs/export ─────────────────────────────────────

@router.get(
    "/export",
    summary="Export Job Requirements",
    description="Export filtered jobs as CSV or Excel.",
)
def export_jobs(
    start_date: Optional[date] = Query(None, description="Filter from date (YYYY-MM-DD)"),
    end_date:   Optional[date] = Query(None, description="Filter to date (YYYY-MM-DD)"),
    company:    Optional[str]  = Query(None, description="Partial match on company name"),
    status_filter: Optional[str] = Query(None, alias="status", description="ACTIVE | CLOSED | ON_HOLD"),
    sort_by: Optional[str] = Query(None, description="Field to sort by"),
    sort_order: Optional[str] = Query("desc", description="Sort order (asc or desc)"),
    format:     str            = Query("csv",  description="csv or excel"),
    db: Session = Depends(get_db),
):
    """
    GET /api/jobs/export?start_date=2026-01-01&end_date=2026-03-31&status=ACTIVE&format=csv
    GET /api/jobs/export?format=excel
    """
    # ── 1. Fetch filtered data ──────────────────────────────────
    jobs_orm = get_filtered_jobs_for_export(
        db=db,
        start_date=start_date,
        end_date=end_date,
        company=company,
        status=status_filter,
        sort_by=sort_by,
        sort_order=sort_order,
    )

    # ── 2. Flatten ORM objects → list of plain dicts ────────────
    HEADERS = [
        "Job Code", "Date", "Ageing (Days)", "Company Name", "Business Unit",
        "External SPOC", "External SPOC Email",
        "Job Title(s)", "Mandatory Skill", "Assigned To",
        "Total Candidates", "Status",
    ]

    from datetime import date as dt_date
    today = dt_date.today()

    rows = []
    for job in jobs_orm:
        titles = ", ".join(r.job_title for r in job.requirements) if job.requirements else "—"
        total  = sum(r.number_of_open_positions for r in job.requirements)
        
        # Calculate Ageing
        ageing = max(0, (today - job.requisition_open_date).days) if job.requisition_open_date else 0
        
        # Since status and mandatory_skill are now at the requirement level, we can join them or take the first one
        skills = ", ".join(filter(None, set(r.mandatory_skill for r in job.requirements))) if job.requirements else "—"
        statuses = ", ".join(set(r.status for r in job.requirements)) if job.requirements else "—"

        rows.append([
            job.job_code,
            str(job.requisition_open_date),
            ageing,
            job.company_name,
            job.business_unit,
            job.external_spoc or "—",
            job.external_spoc_email_id or "—",
            titles,
            skills,
            job.assigned_to,
            total,
            statuses,
        ])

    # ── 3a. CSV ─────────────────────────────────────────────────
    if format.lower() == "csv":
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(HEADERS)
        writer.writerows(rows)
        output.seek(0)

        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=jobs.csv"},
        )

    # ── 3b. Excel ───────────────────────────────────────────────
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Jobs"

    # Header row — bold
    ws.append(HEADERS)
    for cell in ws[1]:
        cell.font = openpyxl.styles.Font(bold=True)

    # Data rows
    for row in rows:
        ws.append(row)

    # Auto-fit column widths
    for col in ws.columns:
        max_len = max((len(str(cell.value or "")) for cell in col), default=10)
        ws.column_dimensions[col[0].column_letter].width = min(max_len + 4, 50)

    output = io.BytesIO()
    wb.save(output)
    output.seek(0)

    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=jobs.xlsx"},
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
        logger.error(f"Error fetching job by ID: {exc}", exc_info=True)
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=error_response(
                message="An unexpected error occurred",
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
        logger.error(f"Database error while updating job requirement: {db_error}", exc_info=True)
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=error_response(
                message="Database error while updating job requirement",
            ),
        )
    except Exception as exc:
        logger.error(f"Error updating job requirement: {exc}", exc_info=True)
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=error_response(
                message="An unexpected error occurred",
            ),
        )

# ─────────────────────────────────────────────────────────────
# MATCHING & SHORTLISTING ROUTES (Aligned with Spec)
# ─────────────────────────────────────────────────────────────

@router.get("/{job_id}/matches")
def get_matches(job_id: int, strict: bool = Query(True), requirement_id: Optional[int] = Query(None), db: Session = Depends(get_db)):
    """
    GET /api/jobs/{job_id}/matches
    GET /api/jobs/{job_id}/matches?requirement_id=5
    
    Returns all matching candidates with match scores and status.
    If requirement_id is provided, matches against that specific role.
    """
    try:
        result = get_matching_candidates(db, job_id, strict=strict, requirement_id=requirement_id)
        return JSONResponse(
            status_code=200,
            content=success_response("Matching candidates fetched", result)
        )
    except Exception as exc:
        logger.error(f"Error getting matches: {exc}", exc_info=True)
        return JSONResponse(status_code=500, content=error_response("Failed to get matches."))

@router.post("/{job_id}/shortlist")
def shortlist(job_id: int, payload: CandidateActionRequest, db: Session = Depends(get_db)):
    """
    POST /api/jobs/{job_id}/shortlist
    
    Body: { "candidate_id": 123 }
    """
    try:
        shortlist_candidate(db, job_id, payload.candidate_id)
        return JSONResponse(
            status_code=200,
            content=success_response("Candidate shortlisted successfully")
        )
    except Exception as exc:
        logger.error(f"Error shortlisting candidate: {exc}", exc_info=True)
        return JSONResponse(status_code=500, content=error_response("Failed to shortlist candidate."))

@router.post("/{job_id}/reject")
def reject(job_id: int, payload: CandidateActionRequest, db: Session = Depends(get_db)):
    """
    POST /api/jobs/{job_id}/reject
    
    Body: { "candidate_id": 123 }
    """
    try:
        reject_candidate(db, job_id, payload.candidate_id)
        return JSONResponse(
            status_code=200,
            content=success_response("Candidate rejected successfully")
        )
    except Exception as exc:
        logger.error(f"Error rejecting candidate: {exc}", exc_info=True)
        return JSONResponse(status_code=500, content=error_response("Failed to reject candidate."))

@router.get("/{job_id}/shortlisted")
def shortlisted(job_id: int, db: Session = Depends(get_db)):
    """
    GET /api/jobs/{job_id}/shortlisted
    """
    try:
        result = get_shortlisted_candidates(db, job_id)
        return JSONResponse(
            status_code=200,
            content=success_response("Shortlisted candidates fetched", result)
        )
    except Exception as exc:
        logger.error(f"Error fetching shortlisted candidates: {exc}", exc_info=True)
        return JSONResponse(status_code=500, content=error_response("Failed to fetch shortlisted candidates."))


@router.get("/{job_id}/stats")
def get_job_stats(job_id: int, db: Session = Depends(get_db)):
    """
    GET /api/jobs/{job_id}/stats
    
    Returns consolidated openings and candidate pipeline statistics for a job requirement.
    """
    try:
        from app.models.job_requirement import Job
        from app.models.job_candidate import JobCandidateMapping

        job = db.query(Job).filter(Job.id == job_id).first()
        if not job:
            return JSONResponse(
                status_code=status.HTTP_404_NOT_FOUND,
                content=error_response(message="Job requirement not found")
            )

        # Initialize openings counts
        openings_total = 0
        openings_active = 0
        openings_on_hold = 0
        openings_closed = 0
        openings_draft = 0

        for req in job.requirements:
            positions = req.number_of_open_positions or 0
            openings_total += positions
            
            req_status = (req.status or "ACTIVE").upper()
            if req_status == "ACTIVE":
                openings_active += positions
            elif req_status == "ON_HOLD":
                openings_on_hold += positions
            elif req_status == "CLOSED":
                openings_closed += positions
            elif req_status == "DRAFT":
                openings_draft += positions

        # Query candidate mapping statuses for this job
        mappings = db.query(JobCandidateMapping).filter(JobCandidateMapping.job_id == job_id).all()

        cand_shortlisted = 0
        cand_interviewing = 0
        cand_approved = 0
        cand_rejected = 0
        cand_joined = 0

        for mapping in mappings:
            mapping_status = (mapping.status or "").strip().lower()
            
            # "matched" is treated as shortlisted in the new workflow
            if mapping_status in ["shortlisted", "shortlist", "matched"]:
                cand_shortlisted += 1
            elif mapping_status in ["interview scheduled", "interview selected", "interview completed", "interviewing"]:
                cand_interviewing += 1
            elif mapping_status in ["selected", "candidate approved"]:
                cand_approved += 1
            elif mapping_status in ["rejected", "interview rejected", "candidate rejected"]:
                cand_rejected += 1
            elif mapping_status == "joined":
                cand_joined += 1

        stats_data = {
            "job_code": job.job_code,
            "company_name": job.company_name,
            "openings": {
                "total": openings_total,
                "active": openings_active,
                "on_hold": openings_on_hold,
                "closed": openings_closed,
                "draft": openings_draft
            },
            "candidates": {
                "shortlisted": cand_shortlisted,
                "interviewing": cand_interviewing,
                "approved": cand_approved,
                "rejected": cand_rejected,
                "joined": cand_joined
            }
        }

        return JSONResponse(
            status_code=200,
            content=success_response(
                message="Job statistics fetched successfully",
                data=stats_data
            )
        )
    except Exception as exc:
        logger.error(f"Error fetching stats for job {job_id}: {exc}", exc_info=True)
        return JSONResponse(
            status_code=500,
            content=error_response("Failed to fetch job statistics.")
        )

