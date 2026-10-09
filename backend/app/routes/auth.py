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
        # First Time Login Check & OTP Flow (Bypassed for demo)
        if False and target_employee.is_first_login:
            from app.utils.smtp import generate_otp, send_otp_email
            from datetime import datetime, timedelta
            
            otp = generate_otp()
            target_employee.otp_code = otp
            target_employee.otp_expiry = datetime.now() + timedelta(minutes=10)
            db.commit()
            
            emp_name = f"{target_employee.first_name} {target_employee.last_name}".strip()
            # In a real scenario, this is sent. We also log it for debugging if SMTP isn't configured.
            send_otp_email(target_employee.email, otp, emp_name)
            
            return JSONResponse(
                status_code=status.HTTP_200_OK,
                content=success_response("First login detected. OTP sent for password change.", {
                    "require_password_change": True,
                    "employee_id": target_employee.employee_id,
                    "email": target_employee.email
                })
            )

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
                        "email": target_employee.email or f"{target_employee.first_name.lower()}@rightmove.in",
                        "photo_url": target_employee.photo_url
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
                        "system_role": user_system_role,
                        "photo_url": target_employee.photo_url
                    }
                })
            )

    return JSONResponse(
        status_code=status.HTTP_401_UNAUTHORIZED,
        content=error_response("Invalid username or password")
    )


from pydantic import BaseModel

class ResetPasswordRequest(BaseModel):
    employee_id: str
    otp_code: str
    new_password: str

@router.post("/verify-otp-and-reset-password")
def verify_otp_and_reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    from datetime import datetime
    from app.core.security import get_password_hash
    
    emp_id_clean = payload.employee_id.strip().lower()
    
    # Find employee
    target_employee = None
    for emp in db.query(Employee).all():
        if (emp.employee_id or "").strip().lower() == emp_id_clean:
            target_employee = emp
            break
            
    if not target_employee:
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content=error_response("Employee not found.")
        )
        
    if not target_employee.otp_code or target_employee.otp_code != payload.otp_code:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content=error_response("Invalid OTP.")
        )
        
    if not target_employee.otp_expiry or target_employee.otp_expiry < datetime.now():
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content=error_response("OTP has expired. Please request a new one.")
        )
        
    # Update password and mark first login as False
    target_employee.employee_password = get_password_hash(payload.new_password)
    target_employee.is_first_login = False
    target_employee.otp_code = None
    target_employee.otp_expiry = None
    
    db.commit()
    
    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content=success_response("Password updated successfully. You can now login.")
    )
