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
    # 1. Check for Hardcoded Admin Credentials
    if payload.username == "admin" and payload.password == "admin123":
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content=success_response("Admin login successful", {
                "token": "mock-admin-token",
                "role": "admin",
                "user": {
                    "username": "admin",
                    "role": "administrator",
                    "email": "admin@rightmove.in"
                }
            })
        )

    # 2. Check for Employee Credentials (Username = Name, Password = ID)
    input_user = payload.username.strip().lower()
    input_pass = payload.password.strip()

    employees = db.query(Employee).all()
    target_employee = None

    for emp in employees:
        db_first = emp.first_name.strip().lower()
        db_full = f"{emp.first_name} {emp.last_name}".strip().lower()
        
        if (db_full == input_user or db_first == input_user) and emp.employee_id.strip() == input_pass:
            target_employee = emp
            break

    if target_employee:
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content=success_response("Employee login successful", {
                "token": f"mock-emp-token-{target_employee.id}",
                "role": "employee",
                "employee": {
                    "id": target_employee.id,
                    "employee_id": target_employee.employee_id,
                    "name": f"{target_employee.first_name} {target_employee.last_name}",
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
