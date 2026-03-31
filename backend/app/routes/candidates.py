import shutil
import os
from datetime import datetime
from fastapi import APIRouter, Depends, status, Query, File, UploadFile, Form
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import Optional

from app.core.database import get_db
from app.schemas.candidate import CandidateCreateRequest, CandidateResponse
from app.services.candidate_service import create_candidate, get_all_candidates, get_candidate_by_id, generate_candidate_code, delete_candidate
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

@router.post("", status_code=status.HTTP_201_CREATED)
async def add_candidate(
    first_name: str = Form(...),
    last_name: str = Form(...),
    email_address: str = Form(...),
    phone_number: str = Form(...),
    country_code: str = Form("+91"),
    business_category: str = Form("IT"),
    current_location: Optional[str] = Form(None),
    current_last_company: Optional[str] = Form(None),
    total_experience: Optional[str] = Form(None),
    relevant_experience_years: Optional[str] = Form(None),
    highest_education: Optional[str] = Form(None),
    skills: Optional[str] = Form(None),
    mapped_job_id: Optional[int] = Form(None),
    relevant_experience_by_skill: Optional[str] = Form(None),
    current_ctc: Optional[str] = Form(None),
    expected_ctc: Optional[str] = Form(None),
    notice_period: Optional[str] = Form(None),
    reason_for_job_change: Optional[str] = Form(None),
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

        # Reconstruct the payload object to pass to service
        payload = CandidateCreateRequest(
            first_name=first_name,
            last_name=last_name,
            email_address=email_address,
            phone_number=phone_number,
            country_code=country_code,
            business_category=business_category,
            current_location=current_location,
            current_last_company=current_last_company,
            total_experience=total_experience,
            relevant_experience_years=relevant_experience_years,
            highest_education=highest_education,
            skills=skills,
            mapped_job_id=mapped_job_id,
            relevant_experience_by_skill=relevant_experience_by_skill,
            current_ctc=current_ctc,
            expected_ctc=expected_ctc,
            notice_period=notice_period,
            reason_for_job_change=reason_for_job_change,
            resume_file_name=resume_file_name,
            resume_url=resume_url
        )

        new_candidate = create_candidate(db, payload)
        data = CandidateResponse.model_validate(new_candidate).model_dump(mode="json")
        return JSONResponse(status_code=201, content=success_response("Candidate created successfully", data))
    except IntegrityError:
        db.rollback()
        return JSONResponse(
            status_code=400, 
            content=error_response("A candidate with this email address already exists.")
        )
    except Exception as exc:
        db.rollback()
        import traceback
        traceback.print_exc()  # This will print the full error to the console
        return JSONResponse(status_code=500, content=error_response(str(exc)))

@router.get("", status_code=status.HTTP_200_OK)
def list_candidates(
    search: Optional[str] = Query(None, description="General search on name, skills, or code"),
    candidate_code: Optional[str] = Query(None, description="Partial matching on candidate code"),
    skills: Optional[str] = Query(None, description="Partial matching on skills"),
    total_experience: Optional[str] = Query(None, description="Partial matching on total experience"),
    current_location: Optional[str] = Query(None, description="Partial matching on current location"),
    business_category: Optional[str] = Query(None, description="Filter by IT, ITSM, BPO"),
    db: Session = Depends(get_db)
):
    try:
        candidates = get_all_candidates(db, search, candidate_code, skills, total_experience, current_location, business_category)
        data = [CandidateResponse.model_validate(c).model_dump(mode="json") for c in candidates]
        return JSONResponse(status_code=200, content=success_response("Candidates fetched successfully", data))
    except Exception as exc:
        import traceback
        traceback.print_exc()  # This will print the full error to the console
        return JSONResponse(status_code=500, content=error_response(str(exc)))

@router.get("/{candidate_id}", status_code=status.HTTP_200_OK)
def get_candidate(candidate_id: int, db: Session = Depends(get_db)):
    try:
        candidate = get_candidate_by_id(db, candidate_id)
        if not candidate:
            return JSONResponse(status_code=404, content=error_response(message="Candidate not found"))
        data = CandidateResponse.model_validate(candidate).model_dump(mode="json")
        return JSONResponse(status_code=200, content=success_response("Candidate fetched successfully", data))
    except Exception as exc:
        return JSONResponse(status_code=500, content=error_response(str(exc)))

@router.delete("/{candidate_id}", status_code=status.HTTP_200_OK)
def remove_candidate(candidate_id: int, db: Session = Depends(get_db)):
    try:
        success = delete_candidate(db, candidate_id)
        if not success:
            return JSONResponse(status_code=404, content=error_response(message="Candidate not found"))
        return JSONResponse(status_code=200, content=success_response("Candidate deleted successfully"))
    except Exception as exc:
        db.rollback()
        return JSONResponse(status_code=500, content=error_response(str(exc)))
