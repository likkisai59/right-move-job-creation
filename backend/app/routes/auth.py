from fastapi import APIRouter, status, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.employee import Employee
from app.schemas.attendance import EmployeeLoginRequest
from app.utils.response import success_response, error_response

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/login")
def login(payload: EmployeeLoginRequest, db: Session = Depends(get_db)):
    # Check for Employee Credentials (Username is Employee ID e.g. RM0011)
    input_user = payload.username.strip().lower()
    input_pass = payload.password.strip()

    if not input_user or not input_pass:
        return JSONResponse(
            status_code=status.HTTP_401_UNAUTHORIZED,
            content=error_response("Employee ID and password are required.")
        )

    target_employee = None
    from app.core.security import verify_password, get_password_hash
    from app.core.config import settings

    # Ensure bootstrap super admin accounts exist in DB and passwords/roles are synced
    if input_user in ["rm0011", "sunmeet singh", "rm0013", "saurabh jadge"]:
        target_id = "RM0011" if "11" in input_user or "sunmeet" in input_user else "RM0013"
        target_pass = settings.SUPERADMIN_SUNMEET_PASS if target_id == "RM0011" else settings.SUPERADMIN_SAURABH_PASS
        existing = db.query(Employee).filter(Employee.employee_id == target_id).first()
        if not existing:
            if target_id == "RM0011":
                new_emp = Employee(
                    employee_id="RM0011",
                    first_name="Sunmeet",
                    last_name="Singh",
                    gender="Male",
                    blood_group="O+",
                    country_code="+91",
                    contact_number="9999999999",
                    email="sunmeet980@gmail.com",
                    designation="Director",
                    system_role="super_admin",
                    status="Active",
                    profile_status="Completed",
                    completion_percentage=100,
                    profile_status_hr="Completed",
                    completion_percentage_hr=100,
                    profile_status_admin="Completed",
                    completion_percentage_admin=100,
                    date_of_joining="2024-01-01",
                    date_of_birth="1990-01-01",
                    date="2024-01-01",
                    permanent_address="Hyderabad",
                    current_address="Hyderabad",
                    assigned_business_unit="IT",
                    reporting_to="Self",
                    work_mode="Office",
                    ctc=25.0,
                    compliance="TDS",
                    employee_password=get_password_hash(target_pass)
                )
            else:
                new_emp = Employee(
                    employee_id="RM0013",
                    first_name="Saurabh",
                    last_name="Jadge",
                    gender="Male",
                    blood_group="A+",
                    country_code="+91",
                    contact_number="8888888888",
                    email="saurabh123@gmail.com",
                    designation="HR",
                    system_role="super_admin",
                    status="Active",
                    profile_status="Completed",
                    completion_percentage=100,
                    profile_status_hr="Completed",
                    completion_percentage_hr=100,
                    profile_status_admin="Completed",
                    completion_percentage_admin=100,
                    date_of_joining="2024-01-01",
                    date_of_birth="1990-01-01",
                    date="2024-01-01",
                    permanent_address="Hyderabad",
                    current_address="Hyderabad",
                    assigned_business_unit="HR",
                    reporting_to="Sunmeet Singh",
                    work_mode="Office",
                    ctc=8.0,
                    compliance="TDS",
                    employee_password=get_password_hash(target_pass)
                )
            db.add(new_emp)
            db.commit()
        else:
            # Sync password and system_role for bootstrap superadmin accounts if outdated/unhashed
            if not existing.employee_password or not verify_password(input_pass, existing.employee_password):
                existing.employee_password = get_password_hash(target_pass)
                existing.system_role = "super_admin"
                db.commit()

    # Search employee by Employee ID (e.g. RM0011) primary match, or full name / email fallback
    for emp in db.query(Employee).all():
        emp_id_clean = (emp.employee_id or "").strip().lower()
        emp_name_clean = f"{emp.first_name or ''} {emp.last_name or ''}".strip().lower()
        emp_email_clean = (emp.email or "").strip().lower()

        if input_user in [emp_id_clean, emp_name_clean, emp_email_clean]:
            if emp.employee_password and verify_password(input_pass, emp.employee_password):
                target_employee = emp
                break

    if target_employee:
        from app.core.security import ROLE_MAP_BY_DESIGNATION
        user_system_role = target_employee.system_role
        if not user_system_role or user_system_role == "unassigned":
            if target_employee.designation:
                norm = target_employee.designation.strip().lower().replace(" ", "").replace(".", "").replace("-", "")
                user_system_role = ROLE_MAP_BY_DESIGNATION.get(norm, "unassigned")
            else:
                user_system_role = "unassigned"

        desig_lower = (target_employee.designation or "").strip().lower()
        is_admin = "admin" in desig_lower or "director" in desig_lower

        if is_admin:
            return JSONResponse(
                status_code=status.HTTP_200_OK,
                content=success_response("Admin login successful", {
                    "token": f"mock-admin-token-{target_employee.id}",
                    "role": "admin",
                    "system_role": user_system_role,
                    "user": {
                        "id": target_employee.id,
                        "employee_id": target_employee.employee_id,
                        "username": f"{target_employee.first_name} {target_employee.last_name}".strip(),
                        "role": target_employee.designation,
                        "system_role": user_system_role,
                        "email": target_employee.email or f"{target_employee.first_name.lower()}@rightmove.in"
                    }
                })
            )
        else:
            return JSONResponse(
                status_code=status.HTTP_200_OK,
                content=success_response("Employee login successful", {
                    "token": f"mock-emp-token-{target_employee.id}",
                    "role": "employee",
                    "system_role": user_system_role,
                    "employee": {
                        "id": target_employee.id,
                        "employee_id": target_employee.employee_id,
                        "name": f"{target_employee.first_name} {target_employee.last_name}".strip(),
                        "designation": target_employee.designation,
                        "email": target_employee.email,
                        "contact": target_employee.contact_number,
                        "system_role": user_system_role
                    }
                })
            )

    return JSONResponse(
        status_code=status.HTTP_401_UNAUTHORIZED,
        content=error_response("Invalid username or password")
    )
