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
        "designation": "Intern"
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
        "designation": "Team Lead"
    }
    response = client.post("/api/employees", json=create_payload)
    emp_id = response.json()["data"]["id"]

    # Fill all HR and Admin details to reach 100% completion in both sections
    full_update_payload = {
        "first_name": "Sarah",
        "last_name": "Connor",
        "gender": "Female",
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
        "system_assigned": "Laptop A",
        "sim_card_assigned": "Yes",
        "email_id_configured": "Yes",
        "linkedin_configured": "Yes",
        "google_sheet_configured": "Yes",
        "whatsapp_business_configured": "Yes"
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
