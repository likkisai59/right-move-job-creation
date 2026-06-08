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

    employees = db.query(Employee).all()
    target_employee = None

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
