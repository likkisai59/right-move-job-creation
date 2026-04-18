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
            min_experience=req.min_experience,
            max_experience=req.max_experience,
            location=req.location,
            required_skills=req.required_skills,
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
            min_experience=req.min_experience,
            max_experience=req.max_experience,
            location=req.location,
            required_skills=req.required_skills,
            num_candidates=req.num_candidates
        )
        job.requirements.append(new_requirement)

    db.commit()
    db.refresh(job)
    return job



# ─────────────────────────────────────────────────────────────
# MATCHING & SHORTLISTING HELPERS
# ─────────────────────────────────────────────────────────────

def parse_skills(skills_input: Optional[str]) -> List[str]:
    """
    Parse skills input into a list of trimmed, lowercase skill names.
    Supports JSON arrays and comma-separated strings.
    """
    if not skills_input:
        return []
    
    import json
    # Try parsing as JSON first
    try:
        skills = json.loads(skills_input)
        if isinstance(skills, list):
            return [str(s).strip().lower() for s in skills if str(s).strip()]
    except (json.JSONDecodeError, TypeError):
        pass
        
    # Fallback to comma-separated parsing
    return [s.strip().lower() for s in skills_input.split(',') if s.strip()]

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

def get_matching_candidates(db: Session, job_id: int, strict: bool = True) -> List[dict]:
    """
    Fetches candidates for a job and computes match scores.
    """
    # We match against the job's requirements. 
    # Usually a job has one main requirement title, but here it's structured as list.
    # We'll take the first requirement as the primary one for matching if multiple exist.
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job or not job.requirements:
        return []

    requirement = job.requirements[0] # Primary requirement
    
    required_skills = parse_skills(requirement.required_skills)
    if not required_skills:
        # Fallback to Job's mandatory_skill if requirement.required_skills is empty
        required_skills = parse_skills(job.mandatory_skill)

    min_exp = requirement.min_experience or 0
    max_exp = requirement.max_experience or 100
    job_location = requirement.location or job.company_name # Fallback

    all_candidates = db.query(Candidate).all()
    results = []

    for candidate in all_candidates:
        candidate_skills = parse_skills(candidate.skills)
        # Handle experience which might be string "5" or "5 years"
        try:
            candidate_exp = float(extract_experience_years(candidate.relevant_experience_years or candidate.total_experience))
        except:
            candidate_exp = 0.0
            
        candidate_location = candidate.current_location

        # --- MANDATORY FILTERS ---
        # 1. Strict Skill Filtering (At least one skill must match)
        matched_skills = set(required_skills) & set(candidate_skills)
        if strict and not matched_skills:
            continue

        # --- SCORE CALCULATION ---
        # 1. Skill Match (50%)
        skill_score = 0
        if required_skills:
            skill_percentage = len(matched_skills) / len(required_skills)
            skill_score = skill_percentage * 50

        # 2. Experience Match (20%)
        exp_score = 0
        if min_exp <= candidate_exp <= max_exp:
            exp_score = 20
        elif (min_exp - 1) <= candidate_exp <= (max_exp + 1):
            exp_score = 10 # Partial

        # 3. Location Match (10%)
        loc_score = 0
        if job_location and candidate_location and job_location.lower() == candidate_location.lower():
            loc_score = 10

        # 4. Keyword relevance (20%)
        keyword_score = 0
        job_keywords = set(requirement.job_title.lower().split())
        candidate_text = (candidate.skills or "") + " " + (candidate.relevant_experience_by_skill or "")
        candidate_text = candidate_text.lower()
        
        matches = [kw for kw in job_keywords if kw in candidate_text and len(kw) > 2]
        if job_keywords:
            keyword_score = (len(matches) / len(job_keywords)) * 20
            if keyword_score > 20: keyword_score = 20

        total_score = skill_score + exp_score + loc_score + keyword_score

        # 2. Minimum Match Threshold (Exclude if match_score < 30)
        if strict and total_score < 30:
            continue

        # Get existing mapping status
        mapping = db.query(JobCandidateMapping).filter(
            JobCandidateMapping.job_id == job_id,
            JobCandidateMapping.candidate_id == candidate.id
        ).first()
        
        # Update or Create Mapping in Store
        if mapping:
            mapping.match_score = total_score
        else:
            new_mapping = JobCandidateMapping(
                job_id=job_id,
                candidate_id=candidate.id,
                match_score=total_score,
                status="matched"
            )
            db.add(new_mapping)
        
        db.commit()

        status = mapping.status if mapping else "matched"

        results.append({
            "candidate_id": candidate.id,
            "name": f"{candidate.first_name} {candidate.last_name}",
            "skills": candidate_skills,
            "experience": candidate_exp,
            "match_score": round(total_score, 1),
            "status": status
        })

    # Sort by Match % (Highest first)
    results.sort(key=lambda x: x["match_score"], reverse=True)
    return results

def shortlist_candidate(db: Session, job_id: int, candidate_id: int) -> JobCandidateMapping:
    """
    Updates or creates status = "shortlisted"
    """
    mapping = db.query(JobCandidateMapping).filter(
        JobCandidateMapping.job_id == job_id,
        JobCandidateMapping.candidate_id == candidate_id
    ).first()
    
    if mapping:
        mapping.status = "shortlisted"
    else:
        mapping = JobCandidateMapping(
            job_id=job_id,
            candidate_id=candidate_id,
            status="shortlisted"
        )
        db.add(mapping)
    
    db.commit()
    db.refresh(mapping)
    return mapping

def reject_candidate(db: Session, job_id: int, candidate_id: int) -> JobCandidateMapping:
    """
    Updates or creates status = "rejected"
    """
    mapping = db.query(JobCandidateMapping).filter(
        JobCandidateMapping.job_id == job_id,
        JobCandidateMapping.candidate_id == candidate_id
    ).first()
    
    if mapping:
        mapping.status = "rejected"
    else:
        mapping = JobCandidateMapping(
            job_id=job_id,
            candidate_id=candidate_id,
            status="rejected"
        )
        db.add(mapping)
    
    db.commit()
    db.refresh(mapping)
    return mapping

def get_shortlisted_candidates(db: Session, job_id: int) -> List[dict]:
    """
    Returns shortlisted candidates with their match scores.
    """
    mappings = db.query(JobCandidateMapping).filter(
        JobCandidateMapping.job_id == job_id,
        JobCandidateMapping.status == "shortlisted"
    ).all()
    
    candidate_ids = [m.candidate_id for m in mappings]
    candidates = db.query(Candidate).filter(Candidate.id.in_(candidate_ids)).all()
    
    # We need to compute scores again or fetch them if they were stored.
    # For now, let's just return candidate info.
    results = []
    # Create a map for quick lookup
    mapping_dict = {m.candidate_id: m for m in mappings}
    
    for candidate in candidates:
        results.append({
            "candidate_id": candidate.id,
            "name": f"{candidate.first_name} {candidate.last_name}",
            "skills": parse_skills(candidate.skills),
            "experience": extract_experience_years(candidate.relevant_experience_years or candidate.total_experience),
            "match_score": mapping_dict[candidate.id].match_score or 0,
            "status": "shortlisted"
        })
    
    return results
