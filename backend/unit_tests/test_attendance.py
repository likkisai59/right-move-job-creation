import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.models.employee import Employee
from app.models.leave import Leave
from app.models.attendance import Attendance
from app.models.designation import Designation
from datetime import date

def test_attendance_and_leave_workflow(client: TestClient, db_session: Session):
    # 1. Create a Manager and a Direct Report Employee
    manager = Employee(
        employee_id="RM1001",
        first_name="Jane",
        last_name="Manager",
        email="jane.manager@example.com",
        contact_number="9876543220",
        designation="Manager",
        employee_password="ManagerPassword"
    )
    report = Employee(
        employee_id="RM1002",
        first_name="Bob",
        last_name="Report",
        email="bob.report@example.com",
        contact_number="9876543221",
        designation="Trainee",
        reporting_to="Jane Manager",
        employee_password="ReportPassword"
    )
    db_session.add_all([manager, report])
    db_session.commit()

    # 2. Test Attendance Login
    login_res = client.post("/api/attendance/login", json={
        "username": "Bob Report",
        "password": "ReportPassword"
    })
    assert login_res.status_code == 200
    assert "token" in login_res.json()["data"]

    # 3. Test Daily Attendance Marking
    mark_payload = {
        "attendance_date": "2026-06-17",
        "first_half_status": "Present",
        "second_half_status": "Present",
        "work_mode": "Office"
    }
    mark_res = client.post(f"/api/attendance/mark?employee_id={report.id}", json=mark_payload)
    assert mark_res.status_code == 200
    assert mark_res.json()["first_half_status"] == "Present"

    # 4. Test Get Attendance History
    hist_res = client.get(f"/api/attendance/history/{report.id}")
    assert hist_res.status_code == 200
    assert len(hist_res.json()) == 1
    assert hist_res.json()[0]["employee_id"] == report.id

    # 5. Apply for Leave
    leave_payload = {
        "employee_id": report.id,
        "leave_type": "Sick Leave",
        "start_date": "2026-06-20",
        "end_date": "2026-06-21",
        "reason": "Flu"
    }
    apply_res = client.post("/api/attendance/leave/apply", json=leave_payload)
    assert apply_res.status_code == 200
    assert apply_res.json()["status"] == "Pending"
    leave_id = apply_res.json()["id"]

    # 6. Retrieve Leave History
    leave_hist = client.get(f"/api/attendance/leave/history/{report.id}")
    assert leave_hist.status_code == 200
    assert len(leave_hist.json()) == 1

    # 7. Get Leaves for Approval (Manager Perspective)
    appr_list = client.get("/api/attendance/approvals/leaves?manager_name=Jane Manager")
    assert appr_list.status_code == 200
    assert len(appr_list.json()) == 1
    assert appr_list.json()[0]["id"] == leave_id

    # 8. Approve Leave Request
    action_payload = {
        "status": "Approved",
        "manager_name": "Jane Manager"
    }
    action_res = client.post(f"/api/attendance/approvals/leaves/{leave_id}/action", json=action_payload)
    assert action_res.status_code == 200
    assert action_res.json()["status"] == "Approved"
    assert action_res.json()["approved_by"] == "Jane Manager"

    # 9. Get Team Attendance
    team_att = client.get("/api/attendance/approvals/team-attendance?manager_name=Jane Manager")
    assert team_att.status_code == 200
    assert len(team_att.json()) == 1
    assert team_att.json()[0]["employee_id"] == report.id

    # 10. Designation config & Leave limits
    config_res = client.get(f"/api/attendance/leave/config/{report.id}")
    assert config_res.status_code == 200
    # Calculated as Trainee (monthly_rate = 1.0) * months_diff (1) = 1.0
    assert config_res.json()["leaves"] == 1.0

    # Save Designation configurations
    desig_item = db_session.query(Designation).filter(Designation.name == "Trainee").first()
    update_config_payload = [{
        "id": desig_item.id,
        "leaves": 15.0,
        "holidays": [{"name": "New Year", "date": "2026-01-01"}]
    }]
    save_res = client.post("/api/attendance/approvals/config", json=update_config_payload)
    assert save_res.status_code == 200
    assert save_res.json()["success"] is True

    # Re-fetch config to confirm update
    config_res_updated = client.get(f"/api/attendance/leave/config/{report.id}")
    assert config_res_updated.json()["leaves"] == 1.0
    assert len(config_res_updated.json()["holidays"]) == 1
