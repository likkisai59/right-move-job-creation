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
    from app.core.security import verify_password, create_access_token
    from app.core.config import settings

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

        # Create real JWT token
        token_payload = {
            "sub": target_employee.employee_id,
            "role": user_system_role
        }
        jwt_token = create_access_token(data=token_payload)

        if is_admin:
            return JSONResponse(
                status_code=status.HTTP_200_OK,
                content=success_response("Admin login successful", {
                    "token": jwt_token,
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
                    "token": jwt_token,
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
