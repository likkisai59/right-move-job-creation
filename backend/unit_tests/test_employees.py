import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.models.employee import Employee
import io

def test_employee_crud_and_filters(client: TestClient, db_session: Session):
    # 1. Create a Draft Employee
    create_payload = {
        "first_name": "John",
        "last_name": "Doe",
        "email": "john.doe@example.com",
        "contact_number": "9999999999",
        "designation": "Intern",
        "is_draft": True
    }
    response = client.post("/api/employees", json=create_payload)
    assert response.status_code == 201
    assert response.json()["success"] is True
    emp_id = response.json()["data"]["id"]
    emp_code = response.json()["data"]["employee_id"]
    assert emp_code.startswith("RM")

    # 2. Get Employee Details
    get_res = client.get(f"/api/employees/{emp_id}")
    assert get_res.status_code == 200
    assert get_res.json()["data"]["first_name"] == "John"
    assert get_res.json()["data"]["profile_status"] == "In Progress" # contains some fields filled

    # 3. List Employees (with filters)
    list_res = client.get("/api/employees?search=John")
    assert list_res.status_code == 200
    assert len(list_res.json()["data"]) == 1

    # Filter by designation
    list_res_desig = client.get("/api/employees?designation=Intern")
    assert len(list_res_desig.json()["data"]) == 1
    list_res_desig_empty = client.get("/api/employees?designation=Director")
    assert len(list_res_desig_empty.json()["data"]) == 1

    # 4. Update Employee
    update_payload = {
        "first_name": "Johnny",
        "blood_group": "B+"
    }
    up_res = client.put(f"/api/employees/{emp_id}", json=update_payload)
    assert up_res.status_code == 200
    
    # Confirm Update
    get_res2 = client.get(f"/api/employees/{emp_id}")
    assert get_res2.json()["data"]["first_name"] == "Johnny"
    assert get_res2.json()["data"]["blood_group"] == "B+"

    # 5. Export Employees
    export_res = client.get("/api/employees/export")
    assert export_res.status_code == 200
    assert export_res.headers["content-type"] == "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"

    # 6. Delete Employee
    del_res = client.delete(f"/api/employees/{emp_id}")
    assert del_res.status_code == 200
    
    # Confirm Delete
    get_res3 = client.get(f"/api/employees/{emp_id}")
    assert get_res3.status_code == 404

def test_employee_file_upload(client: TestClient):
    file_content = b"fake photo content"
    response = client.post(
        "/api/employees/upload",
        files={"file": ("profile.jpg", io.BytesIO(file_content), "image/jpeg")}
    )
    assert response.status_code == 200
    assert response.json()["success"] is True
    assert "url" in response.json()["data"]

def test_employee_password_generation_on_100_percent_completion(client: TestClient, db_session: Session):
    # Create an employee with minimal info
    create_payload = {
        "first_name": "Sarah",
        "last_name": "Connor",
        "email": "sarah.connor@example.com",
        "contact_number": "9999999991",
        "designation": "Team Lead",
        "is_draft": True
    }
    response = client.post("/api/employees", json=create_payload)
    emp_id = response.json()["data"]["id"]

    # Fill all HR and Admin details to reach 100% completion in both sections
    full_update_payload = {
        "first_name": "Sarah",
        "last_name": "Connor",
        "gender": "Female",
        "country_code": "+91",
        "blood_group": "AB+",
        "date_of_birth": "1985-05-15",
        "email": "sarah.connor@example.com",
        "contact_number": "9999999991",
        "contact_number_office": "9999999992",
        "emergency_contact_number": "9999999993",
        "medical_condition": "None",
        "current_address": "Los Angeles, CA",
        "present_address_proof_url": "http://example.com/addr.pdf",
        "permanent_address": "Los Angeles, CA",
        "permanent_address_proof_url": "http://example.com/addr.pdf",
        "aadhar_number": "123456789012",
        "aadhar_url": "http://example.com/aadhar.pdf",
        "pan_number": "ABCDE1234F",
        "pan_url": "http://example.com/pan.pdf",
        "marksheet_10th_url": "http://example.com/10.pdf",
        "marksheet_12th_url": "http://example.com/12.pdf",
        "marksheet_graduation_url": "http://example.com/grad.pdf",
        "photo_url": "http://example.com/photo.jpg",
        "package": 12.0,
        "date_of_joining": "2026-06-01",
        "status": "Active",
        "last_company_name": "Cyberdyne Systems",
        "resume_url": "http://example.com/resume.pdf",
        "salary_slips_url": "http://example.com/slips.pdf",
        "offer_letter_url": "http://example.com/offer.pdf",
        "designation": "Team Lead",
        "assigned_business_unit": "IT",
        "reporting_to": "Sunmeet Singh",
        "work_mode": "Office",
        "ctc": 12.5,
        "compliance": "TDS",
        "bank_name": "Chase Bank",
        "bank_account_number": "98765432101",
        "bank_ifsc_code": "CHAS0001234",
        # Admin fields:
        "system_assigned": "Yes",
        "sim_card_assigned": "Yes",
        "email_id_configured": "Yes",
        "linkedin_configured": "Yes",
        "google_sheet_configured": "Yes",
        "whatsapp_business_configured": "Yes",
        "id_card_admitted": "Yes",
        "insurance_policy_admitted": "Yes",
        "is_final_submit": True
    }

    up_res = client.put(f"/api/employees/{emp_id}", json=full_update_payload)
    assert up_res.status_code == 200

    # Retrieve employee and verify completion is 100%
    get_res = client.get(f"/api/employees/{emp_id}")
    assert get_res.status_code == 200
    emp_data = get_res.json()["data"]
    assert emp_data["profile_status"] == "Completed"
    assert emp_data["completion_percentage_hr"] == 100
    assert emp_data["completion_percentage_admin"] == 100

    # employee_password is intentionally excluded from API response (security improvement)
    # Verify password was generated in the DB using the derived formula: {Initial}{LastName}@{digits}
    from app.models.employee import Employee as EmployeeModel
    from app.core.security import verify_password
    import re
    db_emp = db_session.query(EmployeeModel).filter(EmployeeModel.id == emp_id).first()
    assert db_emp is not None
    assert db_emp.employee_password is not None
    assert db_emp.employee_password.startswith("$2b$") or db_emp.employee_password.startswith("$2a$")
    digits = "".join(re.findall(r"\d+", db_emp.employee_id))
    expected_password = f"SConnor@{digits}"
    assert verify_password(expected_password, db_emp.employee_password)


def test_employee_validation_rules(client: TestClient, db_session: Session):
    # 1. Full submit (is_draft=False) with missing mandatory fields should fail (422)
    incomplete_payload = {
        "first_name": "Alice",
        "last_name": "Smith",
        "email": "alice@example.com",
        "is_draft": False
    }
    res = client.post("/api/employees", json=incomplete_payload)
    assert res.status_code == 422
    err_body = str(res.json())
    assert "Mandatory fields required" in err_body

    # 2. Draft submit with only first_name should succeed (201)
    draft_payload = {
        "first_name": "AliceDraft",
        "is_draft": True
    }
    res_draft = client.post("/api/employees", json=draft_payload)
    assert res_draft.status_code == 201
    assert res_draft.json()["success"] is True

    # 3. Draft submit without first_name should fail (422)
    empty_draft_payload = {
        "last_name": "Smith",
        "is_draft": True
    }
    res_empty_draft = client.post("/api/employees", json=empty_draft_payload)
    assert res_empty_draft.status_code == 422

    # 4. Full submit with Inactive status but missing last_working_date should fail (422)
    inactive_missing_lwd = {
        "first_name": "Inactive",
        "last_name": "User",
        "gender": "Male",
        "date_of_birth": "1995-01-01",
        "email": "inactive.user@example.com",
        "contact_number": "9876543210",
        "current_address": "Hyderabad",
        "permanent_address": "Hyderabad",
        "aadhar_number": "123456789012",
        "pan_number": "ABCDE1234F",
        "date_of_joining": "2024-01-01",
        "status": "Inactive",
        "is_draft": False
    }
    res_inactive_fail = client.post("/api/employees", json=inactive_missing_lwd)
    assert res_inactive_fail.status_code == 422
    assert "Last working date is required when status is Inactive" in str(res_inactive_fail.json())

    # 5. Full submit with all 11 mandatory fields should succeed (201)
    full_valid_payload = {
        "first_name": "Bob",
        "last_name": "Valid",
        "gender": "Male",
        "date_of_birth": "1992-03-15",
        "email": "bob.valid@example.com",
        "contact_number": "9123456780",
        "current_address": "Bangalore, India",
        "permanent_address": "Bangalore, India",
        "aadhar_number": "987654321098",
        "pan_number": "XYZAB5678C",
        "date_of_joining": "2024-06-01",
        "status": "Active",
        "is_draft": False
    }
    res_valid = client.post("/api/employees", json=full_valid_payload)
    assert res_valid.status_code == 201
    assert res_valid.json()["success"] is True

