from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.candidate import CandidateCreate, CandidateResponse
from app.api.candidate.candidate_service import CandidateService
from typing import List

router = APIRouter(prefix="/candidates", tags=["Candidates"])

@router.post("/", response_model=CandidateResponse, status_code=201)
def create_candidate(candidate: CandidateCreate, db: Session = Depends(get_db)):
    return CandidateService.create_candidate(db, candidate)

@router.get("/", response_model=List[CandidateResponse])
def get_candidates(db: Session = Depends(get_db)):
    return CandidateService.get_candidates(db)
