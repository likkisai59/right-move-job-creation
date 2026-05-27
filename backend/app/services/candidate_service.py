import json
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from app.models.candidate import Candidate
from app.models.candidate_edit_history import CandidateEditHistory
from app.schemas.candidate import CandidateCreateRequest, CandidateUpdateRequest
from typing import List, Optional


# ── Fields to track in edit history ──────────────────────────────────────
TRACKED_FIELDS = [
    "first_name", "last_name", "email_address", "alternative_email",
    "phone_number", "alternative_contact_number", "current_location",
    "highest_qualification", "business_unit", "current_last_company",
    "current_designation", "total_experience", "relevant_experience_years",
    "skills", "notice_period", "lwd", "employment_location",
    "current_ctc", "fixed_ctc", "variable_ctc", "expected_ctc",
    "reason_for_job_change", "source", "comments", "recruiter_name",
]


def generate_candidate_code(db: Session) -> str:
    """
    Generates the next unique Candidate ID with prefix CID and 4-digit padding.
    Example: CID0001, CID0002, ...
    Queries the max numeric suffix from existing codes to ensure uniqueness.
    """
    # Extract existing codes that match CIDxxxx pattern
    all_codes = db.query(Candidate.candidate_code).filter(
        Candidate.candidate_code.like("CID%")
    ).all()

    max_num = 0
    for (code,) in all_codes:
        try:
            num = int(code[3:])   # strip "CID" prefix
            if num > max_num:
                max_num = num
        except (ValueError, IndexError):
            pass

    return f"CID{max_num + 1:04d}"


def create_candidate(db: Session, payload: CandidateCreateRequest) -> Candidate:
    code = generate_candidate_code(db)
    data = payload.model_dump()
    new_candidate = Candidate(**data, candidate_code=code)
    db.add(new_candidate)
    db.commit()
    db.refresh(new_candidate)
    return new_candidate


def update_candidate(
    db: Session,
    candidate_id: int,
    payload: CandidateUpdateRequest,
) -> Optional[Candidate]:
    """
    Updates a candidate record and records an edit history entry
    capturing which fields changed, with their old and new values.
    """
    candidate = get_candidate_by_id(db, candidate_id)
    if not candidate:
        return None

    update_data = payload.model_dump(exclude_unset=True)
    updated_by = update_data.pop("updated_by", None)

    # Diff: capture previous vs new values for tracked fields
    previous_values = {}
    new_values = {}
    changed_fields = []

    for field in TRACKED_FIELDS:
        if field in update_data:
            old_val = getattr(candidate, field, None)
            new_val = update_data[field]
            # Convert dates/etc to string for JSON serialization
            old_str = str(old_val) if old_val is not None else None
            new_str = str(new_val) if new_val is not None else None
            if old_str != new_str:
                changed_fields.append(field)
                previous_values[field] = old_str
                new_values[field] = new_str

    # Apply updates to model
    for field, value in update_data.items():
        if hasattr(candidate, field):
            setattr(candidate, field, value)

    db.add(candidate)

    # Record edit history only if something changed
    if changed_fields:
        history = CandidateEditHistory(
            candidate_id=candidate_id,
            updated_by=updated_by,
            changed_fields=json.dumps(changed_fields),
            previous_values=json.dumps(previous_values),
            new_values=json.dumps(new_values),
        )
        db.add(history)

    db.commit()
    db.refresh(candidate)
    return candidate


def get_all_candidates(
    db: Session,
    search: Optional[str] = None,
    candidate_code: Optional[str] = None,
    skills: Optional[str] = None,
    total_experience: Optional[str] = None,
    current_location: Optional[str] = None,
    business_unit: Optional[str] = None,
    notice_period: Optional[str] = None,
) -> List[Candidate]:
    query = db.query(Candidate)

    if search:
        search_term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Candidate.first_name.ilike(search_term),
                Candidate.last_name.ilike(search_term),
                func.concat(Candidate.first_name, ' ', Candidate.last_name).ilike(search_term),
                Candidate.email_address.ilike(search_term),
                Candidate.phone_number.ilike(search_term)
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
    if notice_period:
        query = query.filter(Candidate.notice_period.ilike(f"%{notice_period.strip()}%"))

    if business_unit and business_unit.upper() != "ALL":
        query = query.filter(Candidate.business_unit.ilike(business_unit.strip()))

    return query.order_by(Candidate.created_at.desc()).all()


def get_candidate_by_id(db: Session, candidate_id: int) -> Optional[Candidate]:
    return db.query(Candidate).filter(Candidate.id == candidate_id).first()


def get_candidate_edit_history(db: Session, candidate_id: int) -> List[CandidateEditHistory]:
    return (
        db.query(CandidateEditHistory)
        .filter(CandidateEditHistory.candidate_id == candidate_id)
        .order_by(CandidateEditHistory.updated_at.desc())
        .all()
    )


def delete_candidate(db: Session, candidate_id: int) -> bool:
    candidate = get_candidate_by_id(db, candidate_id)
    if not candidate:
        return False
    db.delete(candidate)
    db.commit()
    return True


def check_candidate_exists(
    db: Session,
    full_name: Optional[str] = None,
    phone_number: Optional[str] = None,
    email_address: Optional[str] = None
) -> dict:
    """
    Checks if a candidate exists with the given full name, phone number or email.
    Returns boolean flags for UI warnings.
    """
    results = {
        "name_exists": False,
        "phone_exists": False,
        "email_exists": False
    }

    if full_name:
        search_name = " ".join(full_name.split()).lower()
        name_match = db.query(Candidate).filter(
            func.lower(func.trim(func.concat(Candidate.first_name, " ", Candidate.last_name))) == search_name
        ).first()
        if name_match:
            results["name_exists"] = True

    if phone_number:
        phone_match = db.query(Candidate).filter(Candidate.phone_number == phone_number.strip()).first()
        if phone_match:
            results["phone_exists"] = True

    if email_address:
        email_match = db.query(Candidate).filter(
            func.lower(Candidate.email_address) == email_address.strip().lower()
        ).first()
        if email_match:
            results["email_exists"] = True

    return results
