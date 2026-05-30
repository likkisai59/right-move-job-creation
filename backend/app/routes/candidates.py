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
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import Optional

from pydantic import ValidationError
from app.core.database import get_db
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
    skip: int = Query(0, description="Pagination skip"),
    limit: int = Query(1000, description="Pagination limit"),
    db: Session = Depends(get_db)
):
    try:
        candidates = get_all_candidates(
            db, search, candidate_code, skills, total_experience,
            current_location, business_unit, notice_period, skip, limit
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
    format: str = Query("csv", description="csv or excel"),
    db: Session = Depends(get_db)
):
    candidates_orm = get_all_candidates(
        db=db, search=search, skills=skills,
        total_experience=total_experience,
        business_unit=business_unit, notice_period=notice_period
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
