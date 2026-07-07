import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.models.designation import Designation
from app.models.business_unit import BusinessUnit
from app.models.work_mode import WorkMode
from app.models.exit_type import ExitType
from app.models.organization import Organization
from app.models.employee import Employee
from app.models.candidate import Candidate
from app.models.job_requirement import Job
import io

# ── DESIGNATIONS ──────────────────────────────────────────────

def test_get_designations(client: TestClient):
    response = client.get("/api/designations")
    assert response.status_code == 200
    res_data = response.json()
    assert res_data["success"] is True
    assert len(res_data["data"]) > 0

def test_create_designation_success(client: TestClient, db_session: Session):
    response = client.post("/api/designations", json={"name": "Architect"})
    assert response.status_code == 201
    res_data = response.json()
    assert res_data["success"] is True
    assert res_data["data"]["name"] == "Architect"
    
    # Check database
    desig = db_session.query(Designation).filter(Designation.name == "Architect").first()
    assert desig is not None

def test_create_designation_duplicate(client: TestClient):
    # 'Director' is seeded by default
    response = client.post("/api/designations", json={"name": "Director"})
    assert response.status_code == 400
    assert "already exists" in response.json()["message"]

def test_update_designation_cascade(client: TestClient, db_session: Session):
    # Create designation and employee
    desig = Designation(name="Old Designation", is_active=True)
    db_session.add(desig)
    db_session.commit()

    emp = Employee(
        employee_id="RM0099",
        first_name="Alice",
        last_name="Wonder",
        email="alice@example.com",
        contact_number="9876543212",
        designation="Old Designation"
    )
    db_session.add(emp)
    db_session.commit()

    # Update designation name
    response = client.put(f"/api/designations/{desig.id}", json={"name": "New Designation"})
    assert response.status_code == 200
    assert response.json()["success"] is True

    # Check database designations table
    db_session.refresh(desig)
    assert desig.name == "New Designation"

    # Verify cascade update on Employee
    db_session.refresh(emp)
    assert emp.designation == "New Designation"

# ── BUSINESS UNITS ────────────────────────────────────────────

def test_get_business_units(client: TestClient):
    response = client.get("/api/business-units")
    assert response.status_code == 200
    assert response.json()["success"] is True

def test_create_business_unit_success(client: TestClient, db_session: Session):
    response = client.post("/api/business-units", json={"name": "Research"})
    assert response.status_code == 201
    assert response.json()["success"] is True
    assert response.json()["data"]["name"] == "Research"

def test_update_business_unit_cascade(client: TestClient, db_session: Session):
    bu = BusinessUnit(name="Old BU", is_active=True)
    db_session.add(bu)
    db_session.commit()

    from datetime import date
    job = Job(
        job_code="JOB0099",
        requisition_open_date=date(2026, 6, 17),
        company_name="Google",
        business_unit="Old BU",
        assigned_to="Recruiter A"
    )
    cand = Candidate(
        candidate_code="CAND0099",
        first_name="Bob",
        last_name="Builder",
        email_address="bob@builder.com",
        phone_number="1234567890",
        business_unit="Old BU"
    )
    emp = Employee(
        employee_id="RM0098",
        first_name="Charlie",
        last_name="Chaplin",
        email="charlie@example.com",
        contact_number="9876543213",
        assigned_business_unit="Old BU"
    )
    db_session.add_all([job, cand, emp])
    db_session.commit()

    # Rename BU
    response = client.put(f"/api/business-units/{bu.id}", json={"name": "New BU"})
    assert response.status_code == 200

    # Refresh
    db_session.refresh(job)
    db_session.refresh(cand)
    db_session.refresh(emp)

    assert job.business_unit == "New BU"
    assert cand.business_unit == "New BU"
    assert emp.assigned_business_unit == "New BU"

# ── WORK MODES ───────────────────────────────────────────────

def test_get_work_modes(client: TestClient):
    response = client.get("/api/work-modes")
    assert response.status_code == 200
    assert response.json()["success"] is True

def test_create_work_mode(client: TestClient):
    response = client.post("/api/work-modes", json={"name": "Remote Only"})
    assert response.status_code == 201
    assert response.json()["data"]["name"] == "Remote Only"

# ── EXIT TYPES ────────────────────────────────────────────────

def test_get_exit_types(client: TestClient):
    response = client.get("/api/exit-types")
    assert response.status_code == 200
    assert response.json()["success"] is True

def test_create_exit_type(client: TestClient):
    response = client.post("/api/exit-types", json={"name": "Medical Reasons"})
    assert response.status_code == 201
    assert response.json()["data"]["name"] == "Medical Reasons"

# ── ORGANIZATIONS ─────────────────────────────────────────────

def test_organization_crud(client: TestClient, db_session: Session):
    # Create Organization
    payload = {
        "organization_name": "Acme Corp",
        "registered_address": "123 Acme St",
        "billing_address": "123 Acme St Billing",
        "gst_number": "29AAAAA1111A1Z1",
        "primary_contact_name": "John Doe",
        "primary_contact_phone": "9999999999",
        "primary_contact_email": "john@acme.com",
        "contract_signed_date": "2026-06-01",
        "contract_end_date": "2027-06-01",
        "status": "active"
    }
    response = client.post("/api/organizations", json=payload)
    assert response.status_code == 201
    org_id = response.json()["data"]["id"]

    # Check Duplicate
    dup_res = client.get("/api/organizations/check-duplicate?name=Acme Corp")
    assert dup_res.status_code == 200
    assert dup_res.json()["data"]["exists"] is True

    # Get Single
    get_res = client.get(f"/api/organizations/{org_id}")
    assert get_res.status_code == 200
    assert get_res.json()["data"]["organization_name"] == "Acme Corp"

    # List Organizations
    list_res = client.get("/api/organizations")
    assert list_res.status_code == 200
    assert len(list_res.json()["data"]) > 0

    # Update Organization
    up_payload = {"organization_name": "Acme Industries", "status": "active"}
    up_res = client.put(f"/api/organizations/{org_id}", json=up_payload)
    assert up_res.status_code == 200
    assert up_res.json()["data"]["organization_name"] == "Acme Industries"

    # Delete Organization
    del_res = client.delete(f"/api/organizations/{org_id}")
    assert del_res.status_code == 200
    
    # Confirm Deleted
    get_deleted = client.get(f"/api/organizations/{org_id}")
    assert get_deleted.status_code == 404

def test_organization_contract_upload(client: TestClient):
    file_content = b"fake contract text content"
    response = client.post(
        "/api/organizations/upload",
        files={"file": ("contract.pdf", io.BytesIO(file_content), "application/pdf")}
    )
    assert response.status_code == 201
    assert "file_url" in response.json()["data"]
