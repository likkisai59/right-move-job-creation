import shutil
import os
import csv
import io
import json
import openpyxl
import logging
from datetime import datetime, date

logger = logging.getLogger(__name__)
from fastapi import APIRouter, Depends, status, Query, File, UploadFile, Form
from fastapi.responses import JSONResponse, StreamingResponse
from sqlalchemy.orm import Session, joinedload
from sqlalchemy.exc import IntegrityError
from typing import Optional
from fastapi import Header, HTTPException

from pydantic import ValidationError
from sqlalchemy import func
from app.core.database import get_db
from app.models.job_candidate import JobCandidateMapping
from app.models.job_requirement import Job, JobRequirement
from app.schemas.job_candidate import SelectionDetailsResponse, SelectionDetailsUpdate
from app.schemas.candidate import CandidateCreateRequest, CandidateUpdateRequest, CandidateResponse
from app.services.candidate_service import (
    create_candidate,
    update_candidate,
    get_all_candidates,
    get_candidate_by_id,
    generate_candidate_code,
    delete_candidate,
    check_candidate_exists,
    get_candidate_edit_history,
    match_jobs_for_candidate,
)
from app.utils.response import success_response, error_response

router = APIRouter(prefix="/api/candidates", tags=["Candidates"])


@router.get("/next-id", status_code=status.HTTP_200_OK)
def get_next_candidate_id(db: Session = Depends(get_db)):
    try:
        next_id = generate_candidate_code(db)
        return JSONResponse(
            status_code=200,
            content=success_response("Next candidate ID fetched", {"next_id": next_id})
        )
    except Exception as exc:
        return JSONResponse(status_code=500, content=error_response(str(exc)))


@router.get("/check-duplicate", status_code=status.HTTP_200_OK)
def check_duplicate(
    full_name: Optional[str] = Query(None),
    phone_number: Optional[str] = Query(None),
    email_address: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    try:
        results = check_candidate_exists(db, full_name, phone_number, email_address)
        return JSONResponse(status_code=200, content=success_response("Duplicate check completed", results))
    except Exception as exc:
        return JSONResponse(status_code=500, content=error_response(str(exc)))


@router.post("/parse-resume", status_code=status.HTTP_200_OK)
async def parse_resume_endpoint(file: UploadFile = File(...)):
    try:
        from app.services.resume_parser import parse_resume_content
        data = await parse_resume_content(file)
        return JSONResponse(status_code=200, content={"success": True, "data": data})
    except Exception as exc:
        logger.error(f"Error parsing resume: {exc}", exc_info=True)
        return JSONResponse(status_code=500, content={"success": False, "message": "An internal error occurred while parsing the resume."})


@router.post("", status_code=status.HTTP_201_CREATED)
async def add_candidate(
    # ── Personal Details ──────────────────────────────────
    first_name: str = Form(...),
    last_name: str = Form(...),
    email_address: str = Form(...),
    alternative_email: Optional[str] = Form(None),
    phone_number: str = Form(...),
    country_code: str = Form("+91"),
    alternative_contact_number: Optional[str] = Form(None),
    current_location: Optional[str] = Form(None),
    highest_qualification: Optional[str] = Form(None),
    # ── Employee Details ──────────────────────────────────
    business_unit: str = Form("IT"),
    current_last_company: Optional[str] = Form(None),
    current_designation: Optional[str] = Form(None),
    total_experience: Optional[str] = Form(None),
    relevant_experience_years: Optional[str] = Form(None),
    relevant_experience_by_skill: Optional[str] = Form(None),
    skills: Optional[str] = Form(None),
    notice_period: Optional[str] = Form(None),
    lwd: Optional[str] = Form(None),                        # received as string "YYYY-MM-DD"
    employment_location: Optional[str] = Form(None),
    current_ctc: Optional[str] = Form(None),
    fixed_ctc: Optional[str] = Form(None),
    variable_ctc: Optional[str] = Form(None),
    expected_ctc: Optional[str] = Form(None),
    reason_for_job_change: Optional[str] = Form(None),
    source: Optional[str] = Form(None),
    comments: Optional[str] = Form(None),
    recruiter_name: Optional[str] = Form(None),
    # ── Misc ─────────────────────────────────────────────
    profile_status: Optional[str] = Form("Active"),
    mapped_job_id: Optional[int] = Form(None),
    file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    try:
        resume_url = None
        resume_file_name = None

        if file:
            filename = f"{int(datetime.now().timestamp())}_{file.filename}"
            filepath = os.path.join("uploads", filename)
            with open(filepath, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            resume_url = f"/uploads/{filename}"
            resume_file_name = file.filename

        # Parse lwd date string to date object
        parsed_lwd = None
        if lwd and lwd.strip():
            try:
                parsed_lwd = date.fromisoformat(lwd.strip())
            except ValueError:
                pass

        payload = CandidateCreateRequest(
            first_name=first_name,
            last_name=last_name,
            email_address=email_address,
            alternative_email=alternative_email or None,
            phone_number=phone_number,
            country_code=country_code,
            alternative_contact_number=alternative_contact_number or None,
            current_location=current_location,
            highest_qualification=highest_qualification,
            profile_status=profile_status,
            business_unit=business_unit,
            current_last_company=current_last_company,
            current_designation=current_designation,
            total_experience=total_experience,
            relevant_experience_years=relevant_experience_years,
            relevant_experience_by_skill=relevant_experience_by_skill,
            skills=skills,
            notice_period=notice_period,
            lwd=parsed_lwd,
            employment_location=employment_location,
            current_ctc=current_ctc,
            fixed_ctc=fixed_ctc,
            variable_ctc=variable_ctc,
            expected_ctc=expected_ctc,
            reason_for_job_change=reason_for_job_change,
            source=source,
            comments=comments,
            recruiter_name=recruiter_name,
            mapped_job_id=mapped_job_id,
            resume_file_name=resume_file_name,
            resume_url=resume_url
        )

        new_candidate = create_candidate(db, payload)
        data = CandidateResponse.model_validate(new_candidate).model_dump(mode="json")
        return JSONResponse(status_code=201, content=success_response("Candidate created successfully", data))

    except ValidationError as exc:
        error_msg = exc.errors()[0]['msg']
        clean_msg = error_msg.replace('Value error, ', '')
        return JSONResponse(status_code=400, content=error_response(clean_msg))
    except IntegrityError as exc:
        db.rollback()
        error_msg = str(exc.orig)
        if "email_address" in error_msg:
            message = "A candidate with this email address already exists."
        elif "candidate_code" in error_msg:
            message = "Candidate ID already exists."
        else:
            message = "Database unique constraint violation."
        return JSONResponse(status_code=400, content=error_response(message))
    except Exception as exc:
        db.rollback()
        logger.error(f"Error creating candidate: {exc}", exc_info=True)
        return JSONResponse(status_code=500, content=error_response("An internal server error occurred."))


@router.put("/{candidate_id}", status_code=status.HTTP_200_OK)
async def edit_candidate(
    candidate_id: int,
    # ── Personal Details ──────────────────────────────────
    first_name: Optional[str] = Form(None),
    last_name: Optional[str] = Form(None),
    email_address: Optional[str] = Form(None),
    alternative_email: Optional[str] = Form(None),
    phone_number: Optional[str] = Form(None),
    country_code: Optional[str] = Form(None),
    alternative_contact_number: Optional[str] = Form(None),
    current_location: Optional[str] = Form(None),
    highest_qualification: Optional[str] = Form(None),
    # ── Employee Details ──────────────────────────────────
    business_unit: Optional[str] = Form(None),
    current_last_company: Optional[str] = Form(None),
    current_designation: Optional[str] = Form(None),
    total_experience: Optional[str] = Form(None),
    relevant_experience_years: Optional[str] = Form(None),
    relevant_experience_by_skill: Optional[str] = Form(None),
    skills: Optional[str] = Form(None),
    notice_period: Optional[str] = Form(None),
    lwd: Optional[str] = Form(None),
    employment_location: Optional[str] = Form(None),
    current_ctc: Optional[str] = Form(None),
    fixed_ctc: Optional[str] = Form(None),
    variable_ctc: Optional[str] = Form(None),
    expected_ctc: Optional[str] = Form(None),
    reason_for_job_change: Optional[str] = Form(None),
    source: Optional[str] = Form(None),
    comments: Optional[str] = Form(None),
    recruiter_name: Optional[str] = Form(None),
    updated_by: Optional[str] = Form(None),
    # ── Misc ─────────────────────────────────────────────
    profile_status: Optional[str] = Form(None),
    mapped_job_id: Optional[int] = Form(None),
    file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    try:
        existing = get_candidate_by_id(db, candidate_id)
        if not existing:
            return JSONResponse(status_code=404, content=error_response("Candidate not found"))

        resume_url = existing.resume_url
        resume_file_name = existing.resume_file_name

        if file:
            filename = f"{int(datetime.now().timestamp())}_{file.filename}"
            filepath = os.path.join("uploads", filename)
            with open(filepath, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            resume_url = f"/uploads/{filename}"
            resume_file_name = file.filename

        parsed_lwd = None
        if lwd and lwd.strip():
            try:
                parsed_lwd = date.fromisoformat(lwd.strip())
            except ValueError:
                pass

        # Build update payload with only provided fields
        update_fields = {}
        locals_map = {
            "first_name": first_name, "last_name": last_name,
            "email_address": email_address, "alternative_email": alternative_email,
            "phone_number": phone_number, "country_code": country_code,
            "alternative_contact_number": alternative_contact_number,
            "current_location": current_location, "highest_qualification": highest_qualification,
            "profile_status": profile_status,
            "business_unit": business_unit, "current_last_company": current_last_company,
            "current_designation": current_designation, "total_experience": total_experience,
            "relevant_experience_years": relevant_experience_years,
            "relevant_experience_by_skill": relevant_experience_by_skill,
            "skills": skills, "notice_period": notice_period,
            "lwd": parsed_lwd, "employment_location": employment_location,
            "current_ctc": current_ctc, "fixed_ctc": fixed_ctc,
            "variable_ctc": variable_ctc, "expected_ctc": expected_ctc,
            "reason_for_job_change": reason_for_job_change, "source": source,
            "comments": comments, "recruiter_name": recruiter_name,
            "mapped_job_id": mapped_job_id,
            "resume_file_name": resume_file_name, "resume_url": resume_url,
            "updated_by": updated_by,
        }
        for key, val in locals_map.items():
            if val is not None:
                update_fields[key] = val

        payload = CandidateUpdateRequest(**update_fields)
        updated = update_candidate(db, candidate_id, payload)
        if not updated:
            return JSONResponse(status_code=404, content=error_response("Candidate not found"))

        data = CandidateResponse.model_validate(updated).model_dump(mode="json")
        return JSONResponse(status_code=200, content=success_response("Candidate updated successfully", data))

    except ValidationError as exc:
        error_msg = exc.errors()[0]['msg']
        clean_msg = error_msg.replace('Value error, ', '')
        return JSONResponse(status_code=400, content=error_response(clean_msg))
    except IntegrityError as exc:
        db.rollback()
        error_msg = str(exc.orig)
        if "email_address" in error_msg:
            message = "A candidate with this email address already exists."
        else:
            message = "Database unique constraint violation."
        return JSONResponse(status_code=400, content=error_response(message))
    except Exception as exc:
        db.rollback()
        logger.error(f"Error updating candidate: {exc}", exc_info=True)
        return JSONResponse(status_code=500, content=error_response("An internal server error occurred."))


@router.get("", status_code=status.HTTP_200_OK)
def list_candidates(
    search: Optional[str] = Query(None, description="General search on name, skills, or code"),
    candidate_code: Optional[str] = Query(None, description="Partial matching on candidate code"),
    skills: Optional[str] = Query(None, description="Partial matching on skills"),
    total_experience: Optional[str] = Query(None, description="Partial matching on total experience"),
    current_location: Optional[str] = Query(None, description="Partial matching on current location"),
    business_unit: Optional[str] = Query(None, description="Filter by business unit"),
    notice_period: Optional[str] = Query(None, description="Filter by notice period"),
    sort_by: Optional[str] = Query(None, description="Field to sort by"),
    sort_order: Optional[str] = Query("desc", description="Sort order (asc or desc)"),
    skip: int = Query(0, description="Pagination skip"),
    limit: int = Query(1000, description="Pagination limit"),
    db: Session = Depends(get_db)
):
    try:
        candidates = get_all_candidates(
            db, search, candidate_code, skills, total_experience,
            current_location, business_unit, notice_period, sort_by, sort_order, skip, limit
        )
        data = [CandidateResponse.model_validate(c).model_dump(mode="json") for c in candidates]
        return JSONResponse(status_code=200, content=success_response("Candidates fetched successfully", data))
    except Exception as exc:
        logger.error(f"Error listing candidates: {exc}", exc_info=True)
        return JSONResponse(status_code=500, content=error_response("An internal server error occurred while fetching candidates."))


@router.get("/export", summary="Export Candidates")
def export_candidates(
    search: Optional[str] = Query(None),
    skills: Optional[str] = Query(None),
    total_experience: Optional[str] = Query(None),
    business_unit: Optional[str] = Query(None),
    notice_period: Optional[str] = Query(None),
    sort_by: Optional[str] = Query(None),
    sort_order: Optional[str] = Query("desc"),
    format: str = Query("csv", description="csv or excel"),
    db: Session = Depends(get_db)
):
    candidates_orm = get_all_candidates(
        db=db, search=search, skills=skills,
        total_experience=total_experience,
        business_unit=business_unit, notice_period=notice_period,
        sort_by=sort_by, sort_order=sort_order, limit=None
    )

    HEADERS = [
        "Candidate ID", "First Name", "Last Name", "Email Address",
        "Alternative Email", "Country Code", "Phone Number",
        "Alternative Contact", "Business Unit", "Current Location",
        "Highest Qualification", "Current/Last Company", "Current Designation",
        "Total Experience", "Relevant Exp (Years)", "Skills",
        "Notice Period", "LWD", "Employment Location",
        "Current CTC", "Fixed CTC", "Variable CTC", "Expected CTC",
        "Reason for Job Change", "Source", "Comments", "Recruiter Name",
        "Resume File Name", "Resume URL", "Created At", "Updated At"
    ]

    rows = []
    for c in candidates_orm:
        phone = f"{c.country_code} {c.phone_number}".strip() if c.country_code or c.phone_number else "—"
        rows.append([
            c.candidate_code,
            c.first_name, c.last_name,
            c.email_address, c.alternative_email or "—",
            c.country_code, phone,
            c.alternative_contact_number or "—",
            c.business_unit,
            c.current_location or "—",
            c.highest_qualification or "—",
            c.current_last_company or "—",
            c.current_designation or "—",
            c.total_experience or "—",
            c.relevant_experience_years or "—",
            c.skills or "—",
            c.notice_period or "—",
            str(c.lwd) if c.lwd else "—",
            c.employment_location or "—",
            c.current_ctc or "—",
            c.fixed_ctc or "—",
            c.variable_ctc or "—",
            c.expected_ctc or "—",
            c.reason_for_job_change or "—",
            c.source or "—",
            c.comments or "—",
            c.recruiter_name or "—",
            c.resume_file_name or "—",
            c.resume_url or "—",
            c.created_at.strftime("%Y-%m-%d %H:%M:%S") if c.created_at else "—",
            c.updated_at.strftime("%Y-%m-%d %H:%M:%S") if c.updated_at else "—",
        ])

    if format.lower() == "csv":
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(HEADERS)
        writer.writerows(rows)
        output.seek(0)
        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=candidates.csv"},
        )

    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Candidates"
    ws.append(HEADERS)
    for row in rows:
        ws.append(row)

    output = io.BytesIO()
    wb.save(output)
    output.seek(0)

    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=candidates.xlsx"},
    )


@router.get("/analytics/pipeline", status_code=status.HTTP_200_OK)
def get_pipeline_analytics(
    business_unit: Optional[str] = Query(None, description="Filter by business unit"),
    db: Session = Depends(get_db)
):
    try:
        from app.models.candidate import Candidate
        
        cand_query = db.query(Candidate)
        if business_unit and business_unit.upper() != "ALL":
            cand_query = cand_query.filter(Candidate.business_unit.ilike(business_unit.strip()))
        total_candidates = cand_query.count()
        
        map_query = db.query(JobCandidateMapping)
        if business_unit and business_unit.upper() != "ALL":
            map_query = map_query.join(Candidate).filter(Candidate.business_unit.ilike(business_unit.strip()))
        mappings = map_query.all()
        
        applied = total_candidates
        matched = 0
        shortlisted = 0
        interviewed = 0
        selected = 0
        joined = 0
        
        # Count highest status for each candidate
        candidate_status_map = {}
        for m in mappings:
            c_id = m.candidate_id
            st = (m.status or "").lower()
            j_st = (m.joining_status or "").lower()
            
            # Joining overrides
            if j_st == "joined":
                val = 6
            elif st == "selected":
                val = 5
            elif "interview" in st:
                val = 4
            elif st == "shortlisted":
                val = 3
            elif st == "matched":
                val = 2
            else:
                val = 1
                
            if c_id not in candidate_status_map or candidate_status_map[c_id] < val:
                candidate_status_map[c_id] = val
                
        for val in candidate_status_map.values():
            if val >= 2: matched += 1
            if val >= 3: shortlisted += 1
            if val >= 4: interviewed += 1
            if val >= 5: selected += 1
            if val >= 6: joined += 1
            
        data = [
            {"stage": "Total", "count": applied, "percentage": 100},
            {"stage": "Matched", "count": matched, "percentage": int((matched/applied)*100) if applied else 0},
            {"stage": "Shortlisted", "count": shortlisted, "percentage": int((shortlisted/applied)*100) if applied else 0},
            {"stage": "Interviewed", "count": interviewed, "percentage": int((interviewed/applied)*100) if applied else 0},
            {"stage": "Selected", "count": selected, "percentage": int((selected/applied)*100) if applied else 0},
            {"stage": "Joined", "count": joined, "percentage": int((joined/applied)*100) if applied else 0},
        ]
        
        return JSONResponse(status_code=200, content=success_response("Pipeline analytics fetched", data))
    except Exception as exc:
        logger.error(f"Error fetching pipeline analytics: {exc}", exc_info=True)
        return JSONResponse(status_code=500, content=error_response("Failed to fetch pipeline analytics."))

@router.get("/{candidate_id}/history", status_code=status.HTTP_200_OK)
def get_edit_history(candidate_id: int, db: Session = Depends(get_db)):
    try:
        candidate = get_candidate_by_id(db, candidate_id)
        if not candidate:
            return JSONResponse(status_code=404, content=error_response("Candidate not found"))
        history = get_candidate_edit_history(db, candidate_id)
        data = []
        for h in history:
            data.append({
                "id": h.id,
                "candidate_id": h.candidate_id,
                "updated_by": h.updated_by,
                "updated_at": h.updated_at.isoformat() if h.updated_at else None,
                "changed_fields": json.loads(h.changed_fields) if h.changed_fields else [],
                "previous_values": json.loads(h.previous_values) if h.previous_values else {},
                "new_values": json.loads(h.new_values) if h.new_values else {},
            })
        return JSONResponse(status_code=200, content=success_response("Edit history fetched", data))
    except Exception as exc:
        logger.error(f"Error fetching candidate history: {exc}", exc_info=True)
        return JSONResponse(status_code=500, content=error_response("An internal server error occurred while fetching history."))


@router.get("/{candidate_id}", status_code=status.HTTP_200_OK)
def get_candidate(candidate_id: int, db: Session = Depends(get_db)):
    try:
        candidate = get_candidate_by_id(db, candidate_id)
        if not candidate:
            return JSONResponse(status_code=404, content=error_response(message="Candidate not found"))
        data = CandidateResponse.model_validate(candidate).model_dump(mode="json")
        return JSONResponse(status_code=200, content=success_response("Candidate fetched successfully", data))
    except Exception as exc:
        logger.error(f"Error fetching candidate: {exc}", exc_info=True)
        return JSONResponse(status_code=500, content=error_response("An internal server error occurred while fetching the candidate."))


@router.delete("/{candidate_id}", status_code=status.HTTP_200_OK)
def remove_candidate(candidate_id: int, db: Session = Depends(get_db)):
    try:
        success = delete_candidate(db, candidate_id)
        if not success:
            return JSONResponse(status_code=404, content=error_response(message="Candidate not found"))
        return JSONResponse(status_code=200, content=success_response("Candidate deleted successfully"))
    except Exception as exc:
        db.rollback()
        logger.error(f"Error deleting candidate: {exc}", exc_info=True)
        return JSONResponse(status_code=500, content=error_response("An internal server error occurred while deleting the candidate."))


@router.post("/{candidate_id}/match-jobs", status_code=status.HTTP_200_OK)
def match_candidate_jobs(candidate_id: int, db: Session = Depends(get_db)):
    try:
        results = match_jobs_for_candidate(db, candidate_id)
        return JSONResponse(status_code=200, content=success_response("Successfully matched jobs for candidate", results))
    except Exception as exc:
        logger.error(f"Error matching jobs for candidate: {exc}", exc_info=True)
        return JSONResponse(status_code=500, content=error_response("An internal server error occurred while matching jobs."))


def get_current_user(authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        # In a real app, this would be 401. For mock auth, default to Recruiter if token is missing
        return {"role": "Recruiter", "id": 999}
    
    token = authorization.split(" ")[1]
    if "admin" in token.lower():
        return {"role": "Admin", "id": 1}
    elif "tl" in token.lower():
        return {"role": "Team Lead", "id": 2}
    else:
        return {"role": "Recruiter", "id": 3}

@router.get("/{candidate_id}/selection-details", status_code=status.HTTP_200_OK)
def get_selection_details(candidate_id: int, db: Session = Depends(get_db)):
    try:
        # Optimized query to fix N+1 issue
        results = db.query(JobCandidateMapping, Job, JobRequirement).join(
            Job, JobCandidateMapping.job_id == Job.id
        ).join(
            JobRequirement, JobCandidateMapping.job_id == JobRequirement.job_id
        ).filter(
            JobCandidateMapping.candidate_id == candidate_id
        ).all()
        
        result = []
        for mapping, job, job_req in results:
            data = SelectionDetailsResponse.model_validate(mapping).model_dump(mode="json")
            data["organization_name"] = job.company_name if job else None
            data["job_title"] = job_req.job_title if job_req else None
            data["job_description"] = job_req.job_description if job_req else None
            data["business_unit"] = job.business_unit if job else None
            data["hiring_manager"] = job.assigned_to if job else None
            result.append(data)
            
        return JSONResponse(status_code=200, content=success_response("Selection details fetched", result))
    except Exception as exc:
        logger.error(f"Error fetching selection details: {exc}", exc_info=True)
        return JSONResponse(status_code=500, content=error_response("An internal server error occurred while fetching selection details."))

def check_incentive_update_permission(role: str) -> bool:
    """
    Hook for role-based access control on updating candidate incentives.
    Currently, anyone is allowed to edit the incentive. In the future, this can be
    restricted to role.lower() in ["admin", "team lead", "tl"] or similar.
    """
    # FUTURE ROLE RESTRICTION: return role.lower() in ["admin", "team lead", "tl"]
    return True # Currently unrestricted

@router.put("/{candidate_id}/selection-details/{mapping_id}", status_code=status.HTTP_200_OK)
def update_selection_details(
    candidate_id: int, 
    mapping_id: int, 
    payload: SelectionDetailsUpdate, 
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    try:
        mapping = db.query(JobCandidateMapping).filter(
            JobCandidateMapping.id == mapping_id,
            JobCandidateMapping.candidate_id == candidate_id
        ).first()
        
        if not mapping:
            return JSONResponse(status_code=404, content=error_response("Selection details not found"))
            
        update_data = payload.model_dump(exclude_unset=True)
        
        # Priority 1: Security Validation
        role = current_user.get("role", "")
        
        if "rate_card" in update_data and update_data["rate_card"] != mapping.rate_card:
            if role.lower() != "admin":
                return JSONResponse(status_code=403, content=error_response("Forbidden: Only Admin can update Rate Card"))
            
        if "incentive" in update_data and update_data["incentive"] != mapping.incentive:
            if not check_incentive_update_permission(role):
                return JSONResponse(status_code=403, content=error_response("Forbidden: Only Admin or Team Lead can update Incentive"))
            
        # Priority 4: Pipeline State Validation
        VALID_TRANSITIONS = {
            "Shortlisted": ["Interview Selected", "Candidate Rejected"],
            "Interview Selected": ["Candidate Approved", "Interview Rejected"],
            "Candidate Approved": ["Joined"],
            "Interview Rejected": [],
            "Candidate Rejected": [],
            "Joined": []
        }
        
        from app.models.job_candidate import CandidateStatusHistory

        new_status_enum = update_data.get("status")
        status_changed = False
        old_status = None
        new_status = None
        
        if new_status_enum:
            new_status = new_status_enum.value if hasattr(new_status_enum, 'value') else new_status_enum
            old_status = mapping.status
            if new_status != old_status:
                allowed_next = VALID_TRANSITIONS.get(old_status, [])
                if new_status not in allowed_next:
                    return JSONResponse(
                        status_code=400, 
                        content=error_response(f"Invalid status transition from {old_status} to {new_status}")
                    )
                mapping.last_status_changed_at = func.now()
                mapping.last_status_changed_by = current_user.get("id")
                status_changed = True

        # Mandatory Field Validations based on status
        check_status = new_status if new_status_enum else mapping.status
        if check_status == "Interview Selected":
            missing = []
            if not update_data.get("interview_date") and not mapping.interview_date: missing.append("Interview Date")
            if not update_data.get("interview_time") and not mapping.interview_time: missing.append("Interview Time")
            if not update_data.get("recruiter_notes") and not mapping.recruiter_notes: missing.append("Recruiter Notes")
            if missing:
                return JSONResponse(status_code=400, content=error_response(f"Mandatory fields missing for Interview Selected: {', '.join(missing)}"))
        elif check_status == "Candidate Approved":
            missing = []
            if not update_data.get("joining_date") and not mapping.joining_date: missing.append("Joining Date")
            if not update_data.get("salary_offered") and not mapping.salary_offered: missing.append("Salary")
            if not update_data.get("band") and not mapping.band: missing.append("Band")
            if not update_data.get("approval_date") and not mapping.approval_date: missing.append("Approval Date")
            if not update_data.get("incentive") and not mapping.incentive: missing.append("Incentive")
            if missing:
                return JSONResponse(status_code=400, content=error_response(f"Mandatory fields missing for Candidate Approved: {', '.join(missing)}"))

        elif check_status == "Joined":
            missing = []
            if not update_data.get("joining_date") and not mapping.joining_date: missing.append("Joining Date")
            if not update_data.get("joined_by") and not mapping.joined_by: missing.append("Joined By")
            if not update_data.get("remarks") and not mapping.remarks: missing.append("Remarks")
            if missing:
                return JSONResponse(status_code=400, content=error_response(f"Mandatory fields missing for Joined: {', '.join(missing)}"))
        elif check_status == "Candidate Rejected":
            if not update_data.get("rejection_date") and not mapping.rejection_date:
                return JSONResponse(status_code=400, content=error_response("Rejection Date is mandatory for Candidate Rejected status"))

        # Priority 6: Business Validation (Joining Date against Mapping Date)
        new_joining_date = update_data.get("joining_date")
        if new_joining_date:
            if isinstance(new_joining_date, date):
                if new_joining_date < mapping.created_at.date():
                    return JSONResponse(
                        status_code=400,
                        content=error_response("Joining Date cannot be before the candidate was mapped to this job")
                    )

        logger.info(f"Updating JobCandidateMapping {mapping_id} for candidate {candidate_id} with values: {update_data}")
        
        for key, value in update_data.items():
            # Extract enum values if applicable
            if hasattr(value, 'value'):
                setattr(mapping, key, value.value)
            else:
                setattr(mapping, key, value)
            
        # Priority 5: Audit Trail
        mapping.updated_by = current_user.get("id")
            
        if status_changed:
            history = CandidateStatusHistory(
                candidate_id=candidate_id,
                job_id=mapping.job_id,
                old_status=old_status,
                new_status=new_status,
                changed_by=current_user.get("id"),
                remarks=update_data.get("remarks") or update_data.get("recruiter_notes") or update_data.get("tl_notes") or ""
            )
            db.add(history)

        db.commit()
        db.refresh(mapping)
        return JSONResponse(status_code=200, content=success_response("Selection details updated successfully", {}))
    except Exception as exc:
        db.rollback()
        logger.error(f"Error updating selection details: {exc}", exc_info=True)
        return JSONResponse(status_code=500, content=error_response("An internal server error occurred while updating selection details."))


@router.get(
    "/analytics/dashboard",
    summary="Dashboard Recruitment Metrics",
    description="Returns aggregate recruitment metrics across all jobs and candidates.",
)
def get_dashboard_analytics(
    business_unit: Optional[str] = Query(None, description="Filter by business unit"),
    db: Session = Depends(get_db),
):
    try:
        from app.models.job_requirement import Job, JobRequirement
        from app.models.candidate import Candidate
        from app.models.job_candidate import JobCandidateMapping

        # Base queries
        jobs_query = db.query(Job)
        requirements_query = db.query(JobRequirement)
        candidates_query = db.query(Candidate)
        mappings_query = db.query(JobCandidateMapping)

        # If business_unit filter is applied
        if business_unit and business_unit.upper() != "ALL":
            jobs_query = jobs_query.filter(Job.business_unit == business_unit.upper())
            requirements_query = requirements_query.join(Job).filter(Job.business_unit == business_unit.upper())
            mappings_query = mappings_query.join(Job).filter(Job.business_unit == business_unit.upper())

        # Calculations
        total_jobs = jobs_query.count()
        total_candidates = candidates_query.count()

        # Total Openings (sum of open positions on requirements)
        total_openings_res = requirements_query.with_entities(func.sum(JobRequirement.number_of_open_positions)).scalar()
        total_openings = int(total_openings_res) if total_openings_res is not None else 0

        # Filled Positions = mappings with status 'Joined'
        filled_positions = mappings_query.filter(JobCandidateMapping.status == "Joined").count()

        # Available Openings = Total Openings - Filled Positions
        available_openings = max(0, total_openings - filled_positions)

        # Pipeline stage counts
        shortlisted_count = mappings_query.filter(JobCandidateMapping.status == "Shortlisted").count()
        interview_selected_count = mappings_query.filter(JobCandidateMapping.status == "Interview Selected").count()
        interview_rejected_count = mappings_query.filter(JobCandidateMapping.status == "Interview Rejected").count()
        approved_count = mappings_query.filter(JobCandidateMapping.status == "Candidate Approved").count()
        candidate_rejected_count = mappings_query.filter(JobCandidateMapping.status == "Candidate Rejected").count()
        joined_count = filled_positions # Joined candidates
        rejected_count = mappings_query.filter(
            JobCandidateMapping.status.in_(["Interview Rejected", "Candidate Rejected"])
        ).count()

        return JSONResponse(
            status_code=200,
            content=success_response(
                message="Dashboard statistics fetched successfully",
                data={
                    "total_jobs": total_jobs,
                    "total_candidates": total_candidates,
                    "total_openings": total_openings,
                    "filled_positions": filled_positions,
                    "available_openings": available_openings,
                    "shortlisted_candidates": shortlisted_count,
                    "interview_selected_candidates": interview_selected_count,
                    "interview_rejected_candidates": interview_rejected_count,
                    "approved_candidates": approved_count,
                    "candidate_rejected_candidates": candidate_rejected_count,
                    "joined_candidates": joined_count,
                    "rejected_candidates": rejected_count
                }
            )
        )
    except Exception as exc:
        logger.error(f"Error fetching dashboard analytics: {exc}", exc_info=True)
        return JSONResponse(
            status_code=500,
            content=error_response("An internal server error occurred while fetching dashboard statistics.")
        )

