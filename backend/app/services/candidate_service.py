from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from app.models.candidate import Candidate
from app.schemas.candidate import CandidateCreateRequest
from typing import List, Optional

def generate_candidate_code(db: Session) -> str:
    max_id = db.query(func.max(Candidate.id)).scalar() or 0
    return f"CAN{max_id + 1:04d}"

def create_candidate(db: Session, payload: CandidateCreateRequest) -> Candidate:
    code = generate_candidate_code(db)
    new_candidate = Candidate(**payload.model_dump(), candidate_code=code)
    db.add(new_candidate)
    db.commit()
    db.refresh(new_candidate)
    return new_candidate

def get_all_candidates(
    db: Session,
    search: Optional[str] = None,
    candidate_code: Optional[str] = None,
    skills: Optional[str] = None,
    total_experience: Optional[str] = None,
    current_location: Optional[str] = None,
    business_category: Optional[str] = None,
) -> List[Candidate]:
    query = db.query(Candidate)

    if search:
        search_term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Candidate.first_name.ilike(search_term),
                Candidate.last_name.ilike(search_term),
                Candidate.skills.ilike(search_term),
                Candidate.candidate_code.ilike(search_term),
                Candidate.total_experience.ilike(search_term)
            )
        )

    if candidate_code:
        query = query.filter(Candidate.candidate_code.ilike(f"%{candidate_code.strip()}%"))
    if skills:
        query = query.filter(Candidate.skills.ilike(f"%{skills.strip()}%"))
    if total_experience:
        query = query.filter(Candidate.total_experience.ilike(f"%{total_experience.strip()}%"))
    if current_location:
        query = query.filter(Candidate.current_location.ilike(f"%{current_location.strip()}%"))
        
    if business_category and business_category.upper() != "ALL":
        query = query.filter(Candidate.business_category == business_category.upper())

    return query.order_by(Candidate.created_at.desc()).all()

def get_candidate_by_id(db: Session, candidate_id: int) -> Optional[Candidate]:
    return db.query(Candidate).filter(Candidate.id == candidate_id).first()

def delete_candidate(db: Session, candidate_id: int) -> bool:
    candidate = get_candidate_by_id(db, candidate_id)
    if not candidate:
        return False
    db.delete(candidate)
    db.commit()
    return True

def check_candidate_exists(db: Session, full_name: Optional[str] = None, phone_number: Optional[str] = None) -> dict:
    """
    Checks if a candidate exists with the given full name or phone number.
    Returns boolean flags for UI warnings.
    """
    results = {
        "name_exists": False,
        "phone_exists": False
    }

    if full_name:
        # Normalize spaces (handle double spaces/tabs) and match case-insensitive
        search_name = " ".join(full_name.split()).lower()
        
        # Concat and trim first_name + last_name in SQL for comparison
        name_match = db.query(Candidate).filter(
            func.lower(func.trim(func.concat(Candidate.first_name, " ", Candidate.last_name))) == search_name
        ).first()
        if name_match:
            results["name_exists"] = True


    if phone_number:
        phone_match = db.query(Candidate).filter(Candidate.phone_number == phone_number.strip()).first()
        if phone_match:
            results["phone_exists"] = True

    return results

