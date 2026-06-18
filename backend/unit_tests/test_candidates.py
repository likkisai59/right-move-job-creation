import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.models.candidate import Candidate
from app.models.job_requirement import Job, JobRequirement
from app.models.job_candidate import JobCandidateMapping
import io
from datetime import date, timedelta

def test_candidate_code_generation_and_duplicates(client: TestClient):
    # Get next candidate code
    response = client.get("/api/candidates/next-id")
    assert response.status_code == 200
    assert "next_id" in response.json()["data"]

    # Check duplicate
    response2 = client.get("/api/candidates/check-duplicate?email_address=nonexistent@test.com")
    assert response2.status_code == 200
    assert response2.json()["data"]["email_exists"] is False

def test_candidate_crud(client: TestClient, db_session: Session):
    # 1. Create a Candidate using Form Data
    payload = {
        "first_name": "Clara",
        "last_name": "Oswald",
        "email_address": "clara@tardis.com",
        "phone_number": "9999999981",
        "country_code": "+91",
        "business_unit": "IT",
        "skills": "Python, SQL, Linux",
        "total_experience": "3 years",
        "current_ctc": "60k",
        "expected_ctc": "80k",
        "notice_period": "30 Days",
        "profile_status": "Active"
    }
    response = client.post(
        "/api/candidates",
        data=payload,
        files={"file": ("resume.pdf", io.BytesIO(b"fake resume"), "application/pdf")}
    )
    assert response.status_code == 201
    assert response.json()["success"] is True
    cand_id = response.json()["data"]["id"]
    assert response.json()["data"]["first_name"] == "Clara"
    assert "resume_url" in response.json()["data"]

    # 2. Get Details
    get_res = client.get(f"/api/candidates/{cand_id}")
    assert get_res.status_code == 200
    assert get_res.json()["data"]["email_address"] == "clara@tardis.com"

    # 3. Duplicate checks should now fail
    dup_res = client.get("/api/candidates/check-duplicate?email_address=clara@tardis.com")
    assert dup_res.json()["data"]["email_exists"] is True

    # 4. List Candidates
    list_res = client.get("/api/candidates?search=Clara")
    assert list_res.status_code == 200
    assert len(list_res.json()["data"]) == 1

    # 5. Export Candidates
    export_csv = client.get("/api/candidates/export?format=csv")
    assert export_csv.status_code == 200
    assert "text/csv" in export_csv.headers["content-type"]

    # 6. Update Candidate
    update_payload = {
        "first_name": "Clara Oswald Oswald",
        "expected_ctc": "90k"
    }
    up_res = client.put(f"/api/candidates/{cand_id}", data=update_payload)
    assert up_res.status_code == 200
    assert up_res.json()["data"]["first_name"] == "Clara Oswald Oswald"

    # 7. Delete Candidate
    del_res = client.delete(f"/api/candidates/{cand_id}")
    assert del_res.status_code == 200
    
    # Verify Deleted
    get_deleted = client.get(f"/api/candidates/{cand_id}")
    assert get_deleted.status_code == 404

def test_candidate_job_matching_and_pipeline_stages(client: TestClient, db_session: Session):
    # 1. Setup Job & Candidate in database
    job = Job(
        job_code="JOB0006",
        requisition_open_date=date.today(),
        company_name="Tardis Corp",
        business_unit="IT",
        assigned_to="Doctor"
    )
    req = JobRequirement(
        job_title="Time Lord assistant",
        budget="30 LPA",
        experience="5 years",
        min_experience=4,
        max_experience=7,
        location="London",
        mandatory_skill="Python, Time travel",
        number_of_open_positions=1,
        status="ACTIVE"
    )
    job.requirements.append(req)
    
    cand = Candidate(
        candidate_code="CAND0006",
        first_name="Rose",
        last_name="Tyler",
        email_address="rose@tardis.com",
        phone_number="9999999982",
        skills="Python, Time travel, Java",
        relevant_experience_years="5",
        current_location="London",
        profile_status="Active",
        business_unit="IT"
    )
    db_session.add_all([job, cand])
    db_session.commit()

    # 2. Test Match Jobs for Candidate endpoint
    response = client.post(f"/api/candidates/{cand.id}/match-jobs")
    assert response.status_code == 200
    matches = response.json()["data"]
    assert len(matches) == 1
    assert matches[0]["job_id"] == job.id

    # Mapping is created as "Shortlisted"
    mapping = db_session.query(JobCandidateMapping).filter(
        JobCandidateMapping.job_id == job.id,
        JobCandidateMapping.candidate_id == cand.id
    ).first()
    assert mapping is not None
    assert mapping.status == "Shortlisted"

    # 3. Test selection-details endpoints
    sel_res = client.get(f"/api/candidates/{cand.id}/selection-details")
    assert sel_res.status_code == 200
    assert len(sel_res.json()["data"]) == 1
    assert sel_res.json()["data"][0]["status"] == "Shortlisted"

    # 4. Pipeline Status updates (Transitions verification)
    
    # Invalid transition (Shortlisted -> Joined directly is not allowed)
    up_payload = {"status": "Joined"}
    bad_res = client.put(f"/api/candidates/{cand.id}/selection-details/{mapping.id}", json=up_payload)
    assert bad_res.status_code == 400
    assert "Invalid status transition" in bad_res.json()["message"]

    # Transition to Interview Selected (requires mandatory interview details)
    up_payload = {"status": "Interview Selected"}
    res_is_failed = client.put(f"/api/candidates/{cand.id}/selection-details/{mapping.id}", json=up_payload)
    assert res_is_failed.status_code == 400 # missing mandatory fields
    assert "Mandatory fields missing" in res_is_failed.json()["message"]

    # Transition to Interview Selected with details
    up_payload = {
        "status": "Interview Selected",
        "interview_date": str(date.today() + timedelta(days=2)),
        "interview_time": "14:00",
        "recruiter_notes": "Good communication"
    }
    res_is = client.put(f"/api/candidates/{cand.id}/selection-details/{mapping.id}", json=up_payload)
    assert res_is.status_code == 200

    # 5. Role validation checks: Rate Card update requires Admin role
    up_payload = {"rate_card": "100.0"}
    res_role_fail = client.put(
        f"/api/candidates/{cand.id}/selection-details/{mapping.id}", 
        json=up_payload,
        headers={"Authorization": "Bearer recruiter"} # Recruiter role
    )
    assert res_role_fail.status_code == 403
    assert "Only Admin can update Rate Card" in res_role_fail.json()["message"]

    # Rate Card update success with Admin role
    res_role_pass = client.put(
        f"/api/candidates/{cand.id}/selection-details/{mapping.id}", 
        json=up_payload,
        headers={"Authorization": "Bearer admin"} # Admin role
    )
    assert res_role_pass.status_code == 200

    # 6. Candidate Approved (requires joining date, salary, band, approval date, incentive)
    up_payload = {
        "status": "Candidate Approved",
        "joining_date": str(date.today() + timedelta(days=10)),
        "salary_offered": "25000",
        "band": "B2",
        "approval_date": str(date.today()),
        "incentive": "1000"
    }
    res_ca = client.put(f"/api/candidates/{cand.id}/selection-details/{mapping.id}", json=up_payload)
    assert res_ca.status_code == 200

    # 7. Joined status (requires joined_by, remarks) - check Job Requirement open positions decrementing!
    assert req.number_of_open_positions == 1
    up_payload = {
        "status": "Joined",
        "joining_date": str(date.today() + timedelta(days=10)),
        "joined_by": "Doctor",
        "remarks": "Successfully joined the Tardis"
    }
    res_j = client.put(f"/api/candidates/{cand.id}/selection-details/{mapping.id}", json=up_payload)
    assert res_j.status_code == 200

    # Verify JobRequirement positions count decremented to 0
    db_session.refresh(req)
    assert req.number_of_open_positions == 0

    # 8. Test Pipeline Analytics
    analytics_res = client.get("/api/candidates/analytics/pipeline")
    assert analytics_res.status_code == 200
    assert analytics_res.json()["success"] is True

def test_dashboard_analytics(client: TestClient, db_session: Session):
    response = client.get("/api/candidates/analytics/dashboard")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "total_jobs" in data["data"]
    assert "total_candidates" in data["data"]
    assert "filled_positions" in data["data"]
    assert "available_openings" in data["data"]
