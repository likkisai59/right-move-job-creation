import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.models.employee import Employee

def test_login_empty_username_or_password(client: TestClient):
    response = client.post("/api/auth/login", json={
        "username": "",
        "password": "somepassword"
    })
    assert response.status_code == 401

def test_login_hardcoded_admin_sunmeet(client: TestClient, db_session: Session):
    response = client.post("/api/auth/login", json={
        "username": "Sunmeet Singh",
        "password": "SSingh@0011"
    })
    assert response.status_code == 200
    res_data = response.json()
    assert res_data["success"] is True
    assert "mock-admin-token" in res_data["data"]["token"]
    assert res_data["data"]["role"] == "admin"
    assert res_data["data"]["user"]["username"] == "Sunmeet Singh"

    # Verify that the employee was dynamically created in the DB
    emp = db_session.query(Employee).filter(Employee.employee_id == "RM0011").first()
    assert emp is not None
    assert emp.first_name == "Sunmeet"
    assert emp.last_name == "Singh"

def test_login_hardcoded_admin_saurabh(client: TestClient, db_session: Session):
    response = client.post("/api/auth/login", json={
        "username": "Saurabh Jadge",
        "password": "SJadge@0013"
    })
    assert response.status_code == 200
    res_data = response.json()
    assert res_data["success"] is True
    assert "mock-emp-token" in res_data["data"]["token"]
    assert res_data["data"]["role"] == "employee"
    assert res_data["data"]["employee"]["name"] == "Saurabh Jadge"

    # Verify Saurabh exists
    emp = db_session.query(Employee).filter(Employee.employee_id == "RM0013").first()
    assert emp is not None
    assert emp.designation == "HR"

def test_login_standard_employee_success(client: TestClient, db_session: Session):
    # Create an employee in the database manually
    emp = Employee(
        employee_id="RM1234",
        first_name="Jane",
        last_name="Doe",
        email="jane.doe@example.com",
        contact_number="9876543210",
        designation="Manager",
        employee_password="MySecretPassword123"
    )
    db_session.add(emp)
    db_session.commit()

    # Attempt login
    response = client.post("/api/auth/login", json={
        "username": "Jane Doe",
        "password": "MySecretPassword123"
    })
    assert response.status_code == 200
    res_data = response.json()
    assert res_data["success"] is True
    assert res_data["data"]["role"] == "employee"
    assert res_data["data"]["employee"]["name"] == "Jane Doe"
    assert res_data["data"]["employee"]["employee_id"] == "RM1234"

def test_login_invalid_password(client: TestClient, db_session: Session):
    # Create employee
    emp = Employee(
        employee_id="RM5678",
        first_name="John",
        last_name="Smith",
        email="john.smith@example.com",
        contact_number="9876543211",
        designation="Trainee",
        employee_password="correct_password"
    )
    db_session.add(emp)
    db_session.commit()

    # Wrong password
    response = client.post("/api/auth/login", json={
        "username": "John Smith",
        "password": "wrong_password"
    })
    assert response.status_code == 401
    assert "Invalid username or password" in response.json()["message"]

def test_login_nonexistent_user(client: TestClient):
    response = client.post("/api/auth/login", json={
        "username": "Nonexistent User",
        "password": "password"
    })
    assert response.status_code == 401
    assert "Invalid username or password" in response.json()["message"]
