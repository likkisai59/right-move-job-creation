import json
from datetime import date
from typing import List, Optional

from sqlalchemy import func, or_
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
        requisition_open_date=payload.requisition_open_date,
        company_name=payload.company_name,
        organization_id=payload.organization_id,
        business_unit=payload.business_unit,
        external_spoc=payload.external_spoc,
        external_spoc_email_id=payload.external_spoc_email_id,
        assigned_to=payload.assigned_to,
        created_by=payload.created_by,
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
            number_of_open_positions=req.number_of_open_positions,
            status=req.status or "ACTIVE",
            mandatory_skill=req.mandatory_skill
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
    business_unit: Optional[str] = None,
    assigned_to: Optional[str] = None,
    created_by: Optional[str] = None,
    sort_by: Optional[str] = None,
    sort_order: Optional[str] = "desc",
    skip: int = 0,
    limit: Optional[int] = 1000,
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
        query = query.filter(Job.requisition_open_date >= start_date)

    if end_date:
        query = query.filter(Job.requisition_open_date <= end_date)

    if status:
        st = status.strip().upper()
        if st in ("HOLD", "ON_HOLD"):
            query = query.join(JobRequirement).filter(JobRequirement.status.in_(["ON_HOLD", "HOLD"]))
        elif st == "INACTIVE":
            query = query.join(JobRequirement).filter(JobRequirement.status.in_(["CLOSED", "DRAFT", "INACTIVE"]))
        else:
            query = query.join(JobRequirement).filter(JobRequirement.status == st)

    if business_unit and business_unit.upper() != "ALL":
        query = query.filter(Job.business_unit.ilike(business_unit.strip()))

    if assigned_to:
        query = query.filter(Job.assigned_to == assigned_to)

    if created_by:
        query = query.filter(Job.created_by == created_by)

    from app.utils.sorting import apply_sorting
    query = apply_sorting(query, Job, sort_by, sort_order, Job.created_at)
    
    if limit is not None:
        query = query.offset(skip).limit(limit)
    return query.all()


# ─────────────────────────────────────────────────────────────
# EXPORT QUERY
# ─────────────────────────────────────────────────────────────

def get_filtered_jobs_for_export(
    db: Session,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    company: Optional[str] = None,
    status: Optional[str] = None,
    business_unit: Optional[str] = None,
    sort_by: Optional[str] = None,
    sort_order: Optional[str] = "desc",
) -> List[Job]:
    """
    Returns filtered jobs for export (CSV / Excel).
    Same filter logic as get_all_jobs but used only by the export endpoint.
    """
    query = db.query(Job)

    if company:
        query = query.filter(Job.company_name.ilike(f"%{company.strip()}%"))

    if start_date:
        query = query.filter(Job.requisition_open_date >= start_date)

    if end_date:
        query = query.filter(Job.requisition_open_date <= end_date)

    if status:
        st = status.strip().upper()
        if st in ("HOLD", "ON_HOLD"):
            query = query.join(JobRequirement).filter(JobRequirement.status.in_(["ON_HOLD", "HOLD"]))
        elif st == "INACTIVE":
            query = query.join(JobRequirement).filter(JobRequirement.status.in_(["CLOSED", "DRAFT", "INACTIVE"]))
        else:
            query = query.join(JobRequirement).filter(JobRequirement.status == st)

    if business_unit and business_unit.upper() != "ALL":
        query = query.filter(Job.business_unit.ilike(business_unit.strip()))

    from app.utils.sorting import apply_sorting
    query = apply_sorting(query, Job, sort_by, sort_order, Job.created_at)
    return query.all()


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
    job.requisition_open_date = payload.requisition_open_date
    job.company_name = payload.company_name
    job.organization_id = payload.organization_id
    job.business_unit = payload.business_unit
    job.external_spoc = payload.external_spoc
    job.external_spoc_email_id = payload.external_spoc_email_id
    job.assigned_to = payload.assigned_to
    job.created_by = payload.created_by

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
            number_of_open_positions=req.number_of_open_positions,
            status=req.status or "ACTIVE",
            mandatory_skill=req.mandatory_skill
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

def get_candidate_skills_set(candidate: Candidate) -> set:
    """
    Extracts all candidate skills from both candidate.skills and
    candidate.relevant_experience_by_skill, deduplicating them into a clean set.
    """
    skills_set = set(parse_skills(candidate.skills))
    if candidate.relevant_experience_by_skill:
        try:
            exp_skills_list = json.loads(candidate.relevant_experience_by_skill)
            if isinstance(exp_skills_list, list):
                for item in exp_skills_list:
                    if isinstance(item, dict) and item.get("skill"):
                        s = str(item["skill"]).strip().lower()
                        if s:
                            skills_set.add(s)
        except Exception:
            pass
    return skills_set

def get_requirement_skills(requirement: JobRequirement) -> List[str]:
    """
    Combines required_skills and mandatory_skill, returning a deduplicated list.
    """
    req_skills_set = set(parse_skills(requirement.required_skills))
    if requirement.mandatory_skill:
        req_skills_set.update(parse_skills(requirement.mandatory_skill))
    return list(req_skills_set)

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

def get_matching_candidates(db: Session, job_id: int, strict: bool = True, requirement_id: Optional[int] = None) -> List[dict]:
    """
    Fetches candidates for a job and computes match scores.
    """
    # We match against the job's requirements. 
    # Usually a job has one main requirement title, but here it's structured as list.
    # We'll take the first requirement as the primary one for matching if multiple exist.
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job or not job.requirements:
        return []

    # Pick specific requirement if requirement_id provided, else use first
    if requirement_id:
        requirement = next((r for r in job.requirements if r.id == requirement_id), job.requirements[0])
    else:
        requirement = job.requirements[0]  # default: first requirement
    
    required_skills = get_requirement_skills(requirement)

    min_exp = requirement.min_experience or 0
    max_exp = requirement.max_experience or 100
    job_location = requirement.location or job.company_name # Fallback

    all_candidates = db.query(Candidate).all()
    results = []

    for candidate in all_candidates:
        candidate_skills_set = get_candidate_skills_set(candidate)
        candidate_skills = list(candidate_skills_set)
        # Handle experience which might be string "5" or "5 years"
        try:
            candidate_exp = float(extract_experience_years(candidate.relevant_experience_years or candidate.total_experience))
        except:
            candidate_exp = 0.0
            
        candidate_location = candidate.current_location

        # --- MANDATORY FILTERS ---
        # 1. Strict Skill Filtering (At least one skill must match)
        matched_skills = set(required_skills) & candidate_skills_set
        missing_skills = set(required_skills) - candidate_skills_set
        
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
        
        import json
        matched_skills_json = json.dumps(list(matched_skills)) if matched_skills else None
        missing_skills_json = json.dumps(list(missing_skills)) if missing_skills else None

        # Update or Create Mapping in Store
        if mapping:
            mapping.match_score = total_score
            mapping.matched_skills = matched_skills_json
            mapping.missing_skills = missing_skills_json
        else:
            new_mapping = JobCandidateMapping(
                job_id=job_id,
                candidate_id=candidate.id,
                match_score=total_score,
                status="Matched",
                matched_skills=matched_skills_json,
                missing_skills=missing_skills_json
            )
            db.add(new_mapping)
        
        try:
            import logging
            logger = logging.getLogger(__name__)
            logger.info(f"Committing mapping for candidate {candidate.id} and job {job_id} with status 'Matched'")
            db.commit()
            
            status = mapping.status if mapping else "Matched"

            results.append({
                "candidate_id": candidate.id,
                "name": f"{candidate.first_name} {candidate.last_name}",
                "skills": candidate_skills,
                "experience": candidate_exp,
                "match_score": round(total_score, 1),
                "status": status,
                "recruiter_name": candidate.recruiter_name,
                "email_address": candidate.email_address,
                "phone_number": candidate.phone_number,
                "country_code": candidate.country_code
            })
        except Exception as exc:
            db.rollback()
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Enum validation or database error for candidate {candidate.id} on job {job_id}: {exc}")

    # Sort by Match % (Highest first)
    results.sort(key=lambda x: x["match_score"], reverse=True)
    return results

def shortlist_candidate(db: Session, job_id: int, candidate_id: int) -> JobCandidateMapping:
    """
    Updates or creates status = "Shortlisted" for candidate on job_id irrespective of match score.
    """
    from app.models.candidate import Candidate
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()

    mapping = db.query(JobCandidateMapping).filter(
        JobCandidateMapping.job_id == job_id,
        JobCandidateMapping.candidate_id == candidate_id
    ).first()
    
    # Calculate match score for reference if not already calculated
    calculated_score = 0
    matched_skills_json = None
    missing_skills_json = None
    if candidate:
        try:
            job = db.query(Job).filter(Job.id == job_id).first()
            if job and job.requirements:
                req = job.requirements[0]
                cand_skills_set = get_candidate_skills_set(candidate)
                req_skills = get_requirement_skills(req)
                matched = set(req_skills) & cand_skills_set
                missing = set(req_skills) - cand_skills_set
                matched_skills_json = json.dumps(list(matched)) if matched else None
                missing_skills_json = json.dumps(list(missing)) if missing else None

                skill_score = (len(matched) / len(req_skills) * 50) if req_skills else 0
                try:
                    c_exp = float(extract_experience_years(candidate.relevant_experience_years or candidate.total_experience))
                except:
                    c_exp = 0.0
                min_e = req.min_experience or 0
                max_e = req.max_experience or 100
                exp_score = 20 if min_e <= c_exp <= max_e else (10 if (min_e - 1) <= c_exp <= (max_e + 1) else 0)
                
                j_loc = req.location or job.company_name
                loc_score = 10 if j_loc and candidate.current_location and j_loc.lower() == candidate.current_location.lower() else 0

                kws = set(req.job_title.lower().split())
                c_txt = ((candidate.skills or "") + " " + (candidate.relevant_experience_by_skill or "")).lower()
                k_matches = [kw for kw in kws if kw in c_txt and len(kw) > 2]
                kw_score = min(20, (len(k_matches) / len(kws) * 20)) if kws else 0

                calculated_score = round(skill_score + exp_score + loc_score + kw_score, 1)
        except Exception as e:
            logger.warning(f"Could not calculate score on manual shortlist: {e}")

    if mapping:
        mapping.status = "Shortlisted"
        if (not mapping.match_score or mapping.match_score == 0) and calculated_score > 0:
            mapping.match_score = calculated_score
            if matched_skills_json: mapping.matched_skills = matched_skills_json
            if missing_skills_json: mapping.missing_skills = missing_skills_json
    else:
        mapping = JobCandidateMapping(
            job_id=job_id,
            candidate_id=candidate_id,
            status="Shortlisted",
            match_score=calculated_score,
            matched_skills=matched_skills_json,
            missing_skills=missing_skills_json
        )
        db.add(mapping)
    
    if candidate and not candidate.mapped_job_id:
        candidate.mapped_job_id = job_id
        db.add(candidate)

    db.commit()
    db.refresh(mapping)
    return mapping

def reject_candidate(db: Session, job_id: int, candidate_id: int) -> JobCandidateMapping:
    """
    Updates or creates status = "Candidate Rejected"
    """
    mapping = db.query(JobCandidateMapping).filter(
        JobCandidateMapping.job_id == job_id,
        JobCandidateMapping.candidate_id == candidate_id
    ).first()
    
    if mapping:
        mapping.status = "Candidate Rejected"
    else:
        mapping = JobCandidateMapping(
            job_id=job_id,
            candidate_id=candidate_id,
            status="Candidate Rejected"
        )
        db.add(mapping)
    
    db.commit()
    db.refresh(mapping)
    return mapping

def get_shortlisted_candidates(db: Session, job_id: int) -> List[dict]:
    """
    Returns shortlisted/pipeline candidates with their match scores.
    """
    mappings = db.query(JobCandidateMapping).filter(
        JobCandidateMapping.job_id == job_id,
        JobCandidateMapping.status != "Matched"
    ).all()
    
    candidate_ids = [m.candidate_id for m in mappings]
    candidates = db.query(Candidate).filter(Candidate.id.in_(candidate_ids)).all()
    
    results = []
    mapping_dict = {m.candidate_id: m for m in mappings}
    
    for candidate in candidates:
        m = mapping_dict[candidate.id]
        results.append({
            "candidate_id": candidate.id,
            "candidate_code": candidate.candidate_code,
            "name": f"{candidate.first_name} {candidate.last_name}",
            "skills": parse_skills(candidate.skills),
            "experience": extract_experience_years(candidate.relevant_experience_years or candidate.total_experience),
            "match_score": m.match_score or 0,
            "status": m.status,
            "mapping_id": m.id,
            "interview_date": m.interview_date.isoformat() if m.interview_date else None,
            "interview_time": m.interview_time,
            "approval_date": m.approval_date.isoformat() if m.approval_date else None,
            "rejection_date": m.rejection_date.isoformat() if m.rejection_date else None,
            "joining_date": m.joining_date.isoformat() if m.joining_date else None,
            "band": m.band,
            "salary_offered": m.salary_offered,
            "rate_card": m.rate_card,
            "incentive": m.incentive,
            "recruiter_notes": m.recruiter_notes,
            "tl_notes": m.tl_notes,
            "client_feedback": m.client_feedback,
            "joined_by": m.joined_by,
            "remarks": m.remarks,
            "recruiter_name": candidate.recruiter_name,
            "email_address": candidate.email_address,
            "phone_number": candidate.phone_number,
            "country_code": candidate.country_code
        })
    
    return results

