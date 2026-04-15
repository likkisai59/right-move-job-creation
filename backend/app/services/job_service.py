from datetime import date
from typing import List, Optional

from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from sqlalchemy.orm import Session
from app.models.job_requirement import Job, JobRequirement
from app.models.candidate import Candidate
from app.models.job_candidate import JobCandidateMapping
from app.schemas.job_requirement import JobCreateRequest, JobUpdateRequest


# ─────────────────────────────────────────────────────────────
# INTERNAL HELPER
# ─────────────────────────────────────────────────────────────

def generate_job_code(db: Session) -> str:
    """
    Auto-generates the next job code in the format JOB0001.
    """
    max_id = db.query(func.max(Job.id)).scalar() or 0
    next_number = max_id + 1
    return f"JOB{next_number:04d}"


# ─────────────────────────────────────────────────────────────
# CREATE
# ─────────────────────────────────────────────────────────────

def create_job_requirement(db: Session, payload: JobCreateRequest) -> Job:
    """
    Creates a new job with multiple requirements.
    """
    job_code = generate_job_code(db)

    new_job = Job(
        job_code=job_code,
        job_date=payload.job_date,
        company_name=payload.company_name,
        organization_id=payload.organization_id,
        business_category=payload.business_category,
        mandatory_skill=payload.mandatory_skill,
        assigned_to=payload.assigned_to,
        status=payload.status or "ACTIVE",
    )

    # Add requirements
    for req in payload.requirements:
        new_requirement = JobRequirement(
            job_title=req.job_title,
            budget=req.budget,
            experience=req.experience,
            num_candidates=req.num_candidates
        )
        new_job.requirements.append(new_requirement)

    db.add(new_job)
    db.commit()
    db.refresh(new_job)
    return new_job


# ─────────────────────────────────────────────────────────────
# LIST
# ─────────────────────────────────────────────────────────────

def get_all_jobs(
    db: Session,
    search: Optional[str] = None,
    company_name: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    status: Optional[str] = None,
    business_category: Optional[str] = None,
) -> List[Job]:
    """
    Returns all jobs with their requirements, with optional filters.
    """
    query = db.query(Job)

    if search:
        search_term = f"%{search.strip()}%"
        query = query.join(JobRequirement).filter(
            or_(
                Job.company_name.ilike(search_term),
                JobRequirement.job_title.ilike(search_term)
            )
        ).distinct()

    if company_name:
        query = query.filter(
            Job.company_name.ilike(f"%{company_name.strip()}%")
        )

    if start_date:
        query = query.filter(Job.job_date >= start_date)

    if end_date:
        query = query.filter(Job.job_date <= end_date)

    if status:
        query = query.filter(Job.status == status.upper())

    if business_category and business_category.upper() != "ALL":
        query = query.filter(Job.business_category == business_category.upper())

    return query.order_by(Job.created_at.desc()).all()


# ─────────────────────────────────────────────────────────────
# EXPORT QUERY
# ─────────────────────────────────────────────────────────────

def get_filtered_jobs_for_export(
    db: Session,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    company: Optional[str] = None,
    status: Optional[str] = None,
) -> List[Job]:
    """
    Returns filtered jobs for export (CSV / Excel).
    Same filter logic as get_all_jobs but used only by the export endpoint.
    """
    query = db.query(Job)

    if company:
        query = query.filter(Job.company_name.ilike(f"%{company.strip()}%"))

    if start_date:
        query = query.filter(Job.job_date >= start_date)

    if end_date:
        query = query.filter(Job.job_date <= end_date)

    if status:
        query = query.filter(Job.status == status.strip().upper())

    return query.order_by(Job.created_at.desc()).all()


# ─────────────────────────────────────────────────────────────
# GET BY ID
# ─────────────────────────────────────────────────────────────

def get_job_by_id(db: Session, job_id: int) -> Optional[Job]:
    """
    Fetches a single job by its ID.
    """
    return db.query(Job).filter(Job.id == job_id).first()


# ─────────────────────────────────────────────────────────────
# UPDATE
# ─────────────────────────────────────────────────────────────

def update_job(
    db: Session,
    job_id: int,
    payload: JobUpdateRequest,
) -> Optional[Job]:
    """
    Updates an existing job and its requirements.
    """
    job = db.query(Job).filter(Job.id == job_id).first()

    if job is None:
        return None

    # Apply parent fields
    job.job_date = payload.job_date
    job.company_name = payload.company_name
    job.organization_id = payload.organization_id
    job.business_category = payload.business_category
    job.mandatory_skill = payload.mandatory_skill
    job.assigned_to = payload.assigned_to
    job.status = payload.status or "ACTIVE"

    # Update requirements (replace existing ones)
    job.requirements = []
    
    # Add new requirements
    for req in payload.requirements:
        new_requirement = JobRequirement(
            job_title=req.job_title,
            budget=req.budget,
            experience=req.experience,
            num_candidates=req.num_candidates
        )
        job.requirements.append(new_requirement)

    db.commit()
    db.refresh(job)
    return job



# ─────────────────────────────────────────────────────────────
# MATCHING & SHORTLISTING HELPERS
# ─────────────────────────────────────────────────────────────

def parse_skills(skills_str: Optional[str]) -> List[str]:
    """
    Parse comma-separated skills string into a list of trimmed skill names.
    """
    if not skills_str:
        return []
    return [s.strip().lower() for s in skills_str.split(',') if s.strip()]

def extract_experience_years(experience_str: Optional[str]) -> int:
    """
    Extract numeric years from experience string.
    Examples: "5 years" -> 5, "2-3 years" -> 2, "fresher" -> 0, "5" -> 5
    """
    if not experience_str or experience_str.lower() == 'fresher':
        return 0
    
    import re
    match = re.search(r'\d+', experience_str)
    if match:
        return int(match.group())
    return 0

def get_job_location(db: Session, job_id: int) -> Optional[str]:
    """
    Get job location from the first requirement if it contains location info.
    This is a placeholder since the Job model doesn't have a location field.
    You may need to add a location field to the Job model in the future.
    """
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job or not job.requirements:
        return None
    
    # Try to extract location from job_title or company_name
    for req in job.requirements:
        if req.job_title:
            # Check if location is mentioned in job title (e.g., "React Developer - Bangalore")
            if '-' in req.job_title:
                parts = req.job_title.split('-')
                if len(parts) > 1:
                    return parts[-1].strip()
    
    # Return company location as fallback
    return job.company_name

def is_candidate_shortlisted(db: Session, job_id: int, candidate_id: int) -> bool:
    """
    Check if a candidate is already shortlisted for a job.
    """
    return db.query(JobCandidateMapping).filter(
        JobCandidateMapping.job_id == job_id,
        JobCandidateMapping.candidate_id == candidate_id
    ).first() is not None

# ─────────────────────────────────────────────────────────────
# MATCHING & SHORTLISTING
# ─────────────────────────────────────────────────────────────

def get_matching_candidates(db: Session, job_id: int) -> dict:
    """
    Fetches candidates whose skills match the job's mandatory skills.
    Returns a dict with total_candidates and matched_candidates with match scores.
    
    Matching Algorithm:
    - Calculate skill match: intersection(job.required_skills, candidate.skills)
    - skill_percentage = matched_skills / total_required_skills
    - Only include candidate if skill_percentage >= 50%
    - Calculate match_score:
      - skill_score = skill_percentage * 70
      - experience_score = 20 if candidate.experience >= job.required_experience else 0
      - location_score = 10 if job.location == candidate.location else 0
      - total_score = skill_score + experience_score + location_score
    - Sort candidates by total_score (descending)
    """
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        return {"job_id": job_id, "total_candidates": 0, "matched_candidates": []}

    # Get required skills from job
    required_skills = parse_skills(job.mandatory_skill)
    
    if not required_skills:
        # If no skills specified, return empty list
        return {"job_id": job_id, "total_candidates": 0, "matched_candidates": []}

    # Get required experience from job requirements
    required_exp = 0
    if job.requirements:
        for req in job.requirements:
            exp = extract_experience_years(req.experience)
            if exp > required_exp:
                required_exp = exp

    # Get job location
    job_location = get_job_location(db, job_id)

    # Fetch all candidates
    all_candidates = db.query(Candidate).all()

    matched_candidates_data = []

    for candidate in all_candidates:
        candidate_skills = parse_skills(candidate.skills)
        candidate_exp = extract_experience_years(candidate.total_experience)
        candidate_location = candidate.current_location

        # Calculate skill match
        matched_skills = list(set(required_skills) & set(candidate_skills))
        skill_percentage = len(matched_skills) / len(required_skills) if required_skills else 0

        # Only include if skill_percentage >= 50%
        if skill_percentage < 0.5:
            continue

        # Calculate scores
        skill_score = skill_percentage * 70
        experience_score = 20 if candidate_exp >= required_exp else 0
        location_score = 10 if job_location and candidate_location and job_location.lower() == candidate_location.lower() else 0
        total_score = skill_score + experience_score + location_score

        matched_candidates_data.append({
            "candidate_id": candidate.id,
            "name": f"{candidate.first_name} {candidate.last_name}",
            "skills": candidate_skills,
            "experience": candidate_exp,
            "match_score": int(total_score),
            "is_shortlisted": is_candidate_shortlisted(db, job_id, candidate.id)
        })

    # Sort by match_score descending
    matched_candidates_data.sort(key=lambda x: x["match_score"], reverse=True)

    return {
        "job_id": job_id,
        "total_candidates": len(matched_candidates_data),
        "matched_candidates": matched_candidates_data
    }

def shortlist_candidate(db: Session, job_id: int, candidate_id: int) -> JobCandidateMapping:
    """
    Shortlists a candidate for a job.
    """
    # Check if already exists
    existing = db.query(JobCandidateMapping).filter(
        JobCandidateMapping.job_id == job_id,
        JobCandidateMapping.candidate_id == candidate_id
    ).first()
    
    if existing:
        raise ValueError("Candidate is already shortlisted for this job")
        
    new_mapping = JobCandidateMapping(
        job_id=job_id,
        candidate_id=candidate_id,
        status="shortlisted"
    )
    db.add(new_mapping)
    db.commit()
    db.refresh(new_mapping)
    return new_mapping

def get_shortlisted_candidates(db: Session, job_id: int) -> List[Candidate]:
    """
    Returns all candidates shortlisted for a specific job.
    """
    return db.query(Candidate).join(
        JobCandidateMapping, Candidate.id == JobCandidateMapping.candidate_id
    ).filter(
        JobCandidateMapping.job_id == job_id
    ).all()
