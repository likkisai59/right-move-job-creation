import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from datetime import date, timedelta
from app.models.employee import Employee
from app.models.organization import Organization
from app.models.job_requirement import Job, JobRequirement
from app.models.job_candidate import JobCandidateMapping
from app.models.candidate import Candidate
from app.models.account import Account, PayrollCalculationsHistory, OrganizationBillingHistory, CandidatesHiredForOrganizationsHistory
import io

def test_accounts_full_flow(client: TestClient, db_session: Session):
    # 1. Create a default employee to link accounts to
    emp = Employee(
        employee_id="RM9999",
        first_name="Alice",
        last_name="Smith",
        email="alice.smith@example.com",
        contact_number="8888888888",
        designation="Manager",
        status="Active",
        profile_status="Completed"
    )
    db_session.add(emp)
    db_session.commit()
    db_session.refresh(emp)

    # 2. Test Get/Update Payroll Config
    config_res = client.get("/api/accounts/config")
    assert config_res.status_code == 200
    assert "pf_percentage" in config_res.json()

    config_update_payload = {
        "pf_percentage": 13.0,
        "tds_percentage": 11.5
    }
    config_up_res = client.put("/api/accounts/config", json=config_update_payload)
    assert config_up_res.status_code == 200
    assert config_up_res.json()["pf_percentage"] == 13.0
    assert config_up_res.json()["tds_percentage"] == 11.5

    # 3. Create Account Baseline for Employee
    create_payload = {
        "employee_id": emp.id,
        "basic_pay": 25000,
        "hra": 10000,
        "loan_amount": 50000,
        "client_incentive": 2000,
        "deduction_amount": 500,
        "unpaid_leaves": 1.5,
        "unpaid_leave_amount": 1200,
        "net_payable_salary": 33800,
        "ctc_offered": 45000,
        "incentives": 1500,
        "candidate_incentives": 1000,
        "client_total": 2000,
        "total_net_payable_salary": 33800,
        "gross_salary": 35000,
        "pf": 3250.0,
        "tds": 2875.0,
        "additional_incentive": 500,
        "incentive_deducted": 100,
        "loan_deducted": 4000,
        "net_salary_pay": 24275,
        "calculated_basic_pay": 23800,
        "baseline_status": 1
    }
    create_res = client.post("/api/accounts/", json=create_payload)
    assert create_res.status_code == 200
    acc_id = create_res.json()["id"]

    # 4. Fetch list of accounts and confirm baseline presence
    list_res = client.get("/api/accounts/")
    assert list_res.status_code == 200
    assert len(list_res.json()) >= 1
    assert any(a["employee_id"] == emp.id for a in list_res.json())

    # 5. Fetch single employee account
    single_res = client.get(f"/api/accounts/employee/{emp.id}")
    assert single_res.status_code == 200
    assert single_res.json()["basic_pay"] == 25000

    # 6. Update single employee account baseline
    update_payload = {
        "basic_pay": 27000
    }
    up_res = client.put(f"/api/accounts/employee/{emp.id}", json=update_payload)
    assert up_res.status_code == 200
    assert up_res.json()["basic_pay"] == 27000

    # 7. Create Placements & Organization billing structures
    org = Organization(
        organization_id="ORG003",
        organization_name="Test Corp",
        cgst=9.0,
        sgst=9.0,
        igst=0.0,
        gst_number="22AAAAA0000A1Z5",
        is_active=1
    )
    db_session.add(org)
    db_session.commit()
    db_session.refresh(org)

    job = Job(
        job_code="JOB99999",
        requisition_open_date=date.today(),
        company_name="Test Corp",
        assigned_to="Recruiter Priya",
        business_unit="IT",
        organization_id=org.id
    )
    db_session.add(job)
    db_session.commit()
    db_session.refresh(job)

    job_req = JobRequirement(
        job_id=job.id,
        job_title="Software Engineer",
        budget="12 LPA",
        experience="2 years",
        min_experience=2,
        max_experience=4,
        location="Pune",
        number_of_open_positions=1,
        status="ACTIVE",
        mandatory_skill="Python"
    )
    db_session.add(job_req)
    db_session.commit()
    db_session.refresh(job_req)

    candidate = Candidate(
        candidate_code="CAND001",
        first_name="John",
        last_name="Doe",
        email_address="john.doe.cand@example.com",
        phone_number="9999999981",
        recruiter_name="Alice Smith"
    )
    db_session.add(candidate)
    db_session.commit()
    db_session.refresh(candidate)

    mapping = JobCandidateMapping(
        job_id=job.id,
        candidate_id=candidate.id,
        status="Joined",
        approval_date=date.today(),
        salary_offered="30000",
        incentive=1500,
        rate_card="Flat",
        band="A"
    )
    db_session.add(mapping)
    db_session.commit()
    db_session.refresh(mapping)

    # 8. Test list placements
    pl_res = client.get("/api/accounts/placements")
    assert pl_res.status_code == 200
    assert len(pl_res.json()) >= 1
    assert pl_res.json()[0]["candidate_name"] == "John Doe"

    # 9. Test list invoices (automatically synchronized on joined mappings)
    inv_res = client.get("/api/accounts/invoices")
    assert inv_res.status_code == 200
    assert len(inv_res.json()) >= 1
    assert inv_res.json()[0]["candidate_name"] == "John Doe"
    assert inv_res.json()[0]["organization_id"] == "ORG003"

    # 10. Update Invoice
    mapping_id = mapping.id
    inv_update_payload = {
        "invoice_number": "INV-ORG003-TEST",
        "gross": 30000.0,
        "billing_status": "Paid"
    }
    inv_up_res = client.put(f"/api/accounts/invoices/{mapping_id}", json=inv_update_payload)
    assert inv_up_res.status_code == 200
    today_str = date.today().strftime("%d-%m-%Y")
    assert inv_up_res.json()["invoice_number"] == f"INV-ORG003-{today_str}"
    assert inv_up_res.json()["billing_status"] == "Paid"

    # 11. Test Export Bank Credit Details (HDFC & ICICI layouts)
    hdfc_export_res = client.get("/api/accounts/credit/export?bank_name=HDFC")
    assert hdfc_export_res.status_code == 200
    assert hdfc_export_res.headers["content-type"] == "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"

    icici_export_res = client.get("/api/accounts/credit/export?bank_name=ICICI")
    assert icici_export_res.status_code == 200
    assert icici_export_res.headers["content-type"] == "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"

    # 12. Test Lock & Close Payroll Month
    close_res = client.post("/api/accounts/close-month")
    assert close_res.status_code == 200
    assert close_res.json()["success"] is True

    # 13. Confirm month closure snapshotted payrolls, billing & placements
    history_months_res = client.get("/api/accounts/history/months")
    assert history_months_res.status_code == 200
    assert len(history_months_res.json()) >= 1
    month_name = history_months_res.json()[0]

    # Verify history Excel exports
    pe_res = client.get(f"/api/accounts/history/export?month={month_name}")
    assert pe_res.status_code == 200
    assert pe_res.headers["content-type"] == "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"

    be_res = client.get(f"/api/accounts/history/billing/export?month={month_name}")
    assert be_res.status_code == 200
    assert be_res.headers["content-type"] == "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
