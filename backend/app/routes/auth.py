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
    # Check for Employee Credentials (Username = Firstname Lastname, Password = Generated Password)
    input_user = payload.username.strip().lower()
    input_pass = payload.password.strip()

    # Enforce username contains at least one space (Firstname Lastname)
    if len(input_user.split()) < 2:
        return JSONResponse(
            status_code=status.HTTP_401_UNAUTHORIZED,
            content=error_response("Invalid username format. Must be 'Firstname Lastname'.")
        )

    target_employee = None

    # Hardcoded bypass/check for the two initial users
    if (input_user == "sunmeet singh" and input_pass == "SSingh@0011") or (input_user == "saurabh jadge" and input_pass == "SJadge@0013"):
        # Look for the employee in the database
        for emp in db.query(Employee).all():
            db_full = f"{emp.first_name} {emp.last_name}".strip().lower()
            if db_full == input_user:
                target_employee = emp
                break
        
        # If the employee is not found in the DB, create and save them dynamically
        if not target_employee:
            from app.models.employee import Employee as EmpModel
            if input_user == "sunmeet singh":
                target_employee = EmpModel(
                    employee_id="RM0011",
                    first_name="Sunmeet",
                    last_name="Singh",
                    designation="Director",
                    status="Active",
                    profile_status="Completed",
                    completion_percentage=100,
                    profile_status_hr="Completed",
                    completion_percentage_hr=100,
                    profile_status_admin="Completed",
                    completion_percentage_admin=100,
                    gender="Male",
                    blood_group="O+",
                    email="sunmeet980@gmail.com",
                    contact_number="9999999999",
                    bank_name="State Bank Of India",
                    bank_account_number="1234567890",
                    bank_ifsc_code="SBIN0001234",
                    assigned_business_unit="IT",
                    reporting_to="Self",
                    work_mode="Office",
                    ctc=25.0,
                    compliance="TDS",
                    employee_password="SSingh@0011"
                )
            else:
                target_employee = EmpModel(
                    employee_id="RM0013",
                    first_name="Saurabh",
                    last_name="Jadge",
                    designation="HR",
                    status="Active",
                    profile_status="Completed",
                    completion_percentage=100,
                    profile_status_hr="Completed",
                    completion_percentage_hr=100,
                    profile_status_admin="Completed",
                    completion_percentage_admin=100,
                    gender="Male",
                    blood_group="A+",
                    email="saurabh123@gmail.com",
                    contact_number="8888888888",
                    bank_name="State Bank Of India",
                    bank_account_number="0987654321",
                    bank_ifsc_code="SBIN0001234",
                    assigned_business_unit="HR",
                    reporting_to="Sunmeet Singh",
                    work_mode="Office",
                    ctc=8.0,
                    compliance="TDS",
                    employee_password="SJadge@0013"
                )
            db.add(target_employee)
            db.commit()
            db.refresh(target_employee)
    else:
        # Fallback to standard database verification
        employees = db.query(Employee).all()
        for emp in employees:
            if not emp.first_name or not emp.last_name:
                continue
                
            db_full = f"{emp.first_name} {emp.last_name}".strip().lower()
            
            # Verify password matches ONLY employee_password (if generated)
            is_pass_valid = False
            if emp.employee_password and emp.employee_password.strip() == input_pass:
                is_pass_valid = True

            if db_full == input_user and is_pass_valid:
                target_employee = emp
                break

    if target_employee:
        # Determine role based on designation
        is_admin = False
        if target_employee.designation:
            desig_lower = target_employee.designation.strip().lower()
            if "admin" in desig_lower or "administrator" in desig_lower or "director" in desig_lower:
                is_admin = True

        if is_admin:
            # Login as Admin
            return JSONResponse(
                status_code=status.HTTP_200_OK,
                content=success_response("Admin login successful", {
                    "token": f"mock-admin-token-{target_employee.id}",
                    "role": "admin",
                    "user": {
                        "username": f"{target_employee.first_name} {target_employee.last_name}".strip(),
                        "role": target_employee.designation,
                        "email": target_employee.email or f"{target_employee.first_name.lower()}@rightmove.in"
                    }
                })
            )
        else:
            # Login as Employee
            return JSONResponse(
                status_code=status.HTTP_200_OK,
                content=success_response("Employee login successful", {
                    "token": f"mock-emp-token-{target_employee.id}",
                    "role": "employee",
                    "employee": {
                        "id": target_employee.id,
                        "employee_id": target_employee.employee_id,
                        "name": f"{target_employee.first_name} {target_employee.last_name}".strip(),
                        "designation": target_employee.designation,
                        "email": target_employee.email,
                        "contact": target_employee.contact_number
                    }
                })
            )

    return JSONResponse(
        status_code=status.HTTP_401_UNAUTHORIZED,
        content=error_response("Invalid username or password")
    )
