import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.models.job_requirement import Job, JobRequirement
from app.models.candidate import Candidate
from app.models.job_candidate import JobCandidateMapping
import io

def test_job_crud_and_exports(client: TestClient, db_session: Session):
    # 1. Create a Job Requirement with nested requirements
    create_payload = {
        "requisition_open_date": "2026-06-17",
        "company_name": "Google",
        "business_unit": "IT",
        "assigned_to": "Recruiter Priya",
        "requirements": [
            {
                "job_title": "React Developer",
                "budget": "15 LPA",
                "experience": "3 years",
                "min_experience": 2,
                "max_experience": 5,
                "location": "Bangalore",
                "number_of_open_positions": 5,
                "status": "ACTIVE",
                "mandatory_skill": "React, TypeScript"
            }
        ]
    }
    response = client.post("/api/jobs", json=create_payload)
    assert response.status_code == 201
    assert response.json()["success"] is True
    job_id = response.json()["data"]["id"]
    job_code = response.json()["data"]["job_code"]
    assert job_code.startswith("JOB")

    # 2. Get Single Job details
    get_res = client.get(f"/api/jobs/{job_id}")
    assert get_res.status_code == 200
    assert get_res.json()["data"]["company_name"] == "Google"
    assert len(get_res.json()["data"]["requirements"]) == 1

    # 3. List Jobs (with search/BU filters)
    list_res = client.get("/api/jobs?search=React")
    assert list_res.status_code == 200
    assert len(list_res.json()["data"]) == 1
    
    # 4. Update Job
    update_payload = {
        "requisition_open_date": "2026-06-17",
        "company_name": "Google Alphabet",
        "business_unit": "IT",
        "assigned_to": "Recruiter Priya",
        "requirements": [
            {
                "job_title": "React Lead Developer",
                "budget": "25 LPA",
                "experience": "6 years",
                "min_experience": 5,
                "max_experience": 8,
                "location": "Bangalore",
                "number_of_open_positions": 3,
                "status": "ACTIVE",
                "mandatory_skill": "React, TypeScript, Redux"
            }
        ]
    }
    up_res = client.put(f"/api/jobs/{job_id}", json=update_payload)
    assert up_res.status_code == 200
    assert up_res.json()["data"]["company_name"] == "Google Alphabet"
    assert up_res.json()["data"]["requirements"][0]["job_title"] == "React Lead Developer"

    # 5. Export Jobs
    export_csv = client.get("/api/jobs/export?format=csv")
    assert export_csv.status_code == 200
    assert "text/csv" in export_csv.headers["content-type"]

    export_xlsx = client.get("/api/jobs/export?format=excel")
    assert export_xlsx.status_code == 200
    assert "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" in export_xlsx.headers["content-type"]

def test_job_upload_jd(client: TestClient):
    file_content = b"fake jd content"
    response = client.post(
        "/api/jobs/upload",
        files={"file": ("jd.docx", io.BytesIO(file_content), "application/vnd.openxmlformats-officedocument.wordprocessingml.document")}
    )
    assert response.status_code == 201
    assert response.json()["success"] is True
    assert "file_url" in response.json()["data"]

def test_job_matching_and_shortlisting_workflows(client: TestClient, db_session: Session):
    # 1. Create a Job
    from datetime import date
    job = Job(
        job_code="JOB0005",
        requisition_open_date=date(2026, 6, 17),
        company_name="Meta",
        business_unit="IT",
        assigned_to="Recruiter Priya"
    )
    req = JobRequirement(
        job_title="Python Developer",
        budget="20 LPA",
        experience="4 years",
        min_experience=3,
        max_experience=6,
        location="Hyderabad",
        mandatory_skill="Python, FastAPI",
        required_skills="Python, FastAPI, Docker",
        number_of_open_positions=2,
        status="ACTIVE"
    )
    job.requirements.append(req)
    
    # 2. Create matching and non-matching Candidates
    cand_match = Candidate(
        candidate_code="CAND0005",
        first_name="Sarah",
        last_name="Connor",
        email_address="sarah@skynet.com",
        phone_number="9999999990",
        skills="Python, FastAPI, Git",
        relevant_experience_years="5",
        current_location="Hyderabad",
        profile_status="Active",
        business_unit="IT"
    )
    
    cand_no_match = Candidate(
        candidate_code="CAND0006",
        first_name="John",
        last_name="Connor",
        email_address="john@skynet.com",
        phone_number="9999999991",
        skills="React, CSS",
        relevant_experience_years="1",
        current_location="Boston",
        profile_status="Active",
        business_unit="IT"
    )
    
    db_session.add_all([job, cand_match, cand_no_match])
    db_session.commit()

    # 3. Test Matches endpoint
    response = client.get(f"/api/jobs/{job.id}/matches?strict=true")
    assert response.status_code == 200
    matches = response.json()["data"]
    # Only Sarah Connor matches the strict filter (shares skills and experience and score >= 30)
    assert len(matches) == 1
    assert matches[0]["candidate_id"] == cand_match.id
    assert matches[0]["match_score"] >= 30

    # 4. Test Shortlist Candidate
    shortlist_payload = {"candidate_id": cand_match.id}
    sl_res = client.post(f"/api/jobs/{job.id}/shortlist", json=shortlist_payload)
    assert sl_res.status_code == 200
    assert sl_res.json()["success"] is True

    # Check mapping table
    mapping = db_session.query(JobCandidateMapping).filter(
        JobCandidateMapping.job_id == job.id,
        JobCandidateMapping.candidate_id == cand_match.id
    ).first()
    assert mapping is not None
    assert mapping.status == "Shortlisted"

    # Get shortlisted list
    sl_list = client.get(f"/api/jobs/{job.id}/shortlisted")
    assert sl_list.status_code == 200
    assert len(sl_list.json()["data"]) == 1
    assert sl_list.json()["data"][0]["candidate_id"] == cand_match.id

    # 5. Test Reject Candidate
    reject_payload = {"candidate_id": cand_match.id}
    rj_res = client.post(f"/api/jobs/{job.id}/reject", json=reject_payload)
    assert rj_res.status_code == 200
    assert rj_res.json()["success"] is True
    
    db_session.refresh(mapping)
    assert mapping.status == "Candidate Rejected"

    # 6. Test Stats endpoint
    stats_res = client.get(f"/api/jobs/{job.id}/stats")
    assert stats_res.status_code == 200
    stats = stats_res.json()["data"]
    assert stats["openings"]["total"] == 2
    assert stats["candidates"]["shortlisted"] == 1 # Shortlisted includes non-Matched statuses
    assert stats["candidates"]["rejected"] == 1
