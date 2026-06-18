from sqlalchemy.orm import Session
from app.models.candidate import Candidate
from app.schemas.candidate import CandidateCreate
from app.core.exceptions import DuplicateCandidateError

class CandidateService:
    @staticmethod
    def create_candidate(db: Session, candidate: CandidateCreate) -> Candidate:
        # Check if candidate_id already exists
        existing = db.query(Candidate).filter(Candidate.candidate_id == candidate.candidate_id).first()
        if existing:
            raise DuplicateCandidateError(candidate_id=candidate.candidate_id)
        
        db_candidate = Candidate(**candidate.model_dump())
        db.add(db_candidate)
        db.commit()
        db.refresh(db_candidate)
        return db_candidate

    @staticmethod
    def get_candidates(db: Session):
        return db.query(Candidate).all()
