from fastapi import APIRouter, Depends, Query
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from typing import Optional
import traceback

from app.core.database import get_db
from app.utils.response import success_response, error_response
from app.schemas.employee import EmployeeCreateRequest, EmployeeUpdateRequest
from app.services import employee_service

# Define the router prefix for all endpoints in this file
router = APIRouter(prefix="/api/employees", tags=["Employees"])

# ─────────────────────────────────────────────────────────────
# CREATE EMPLOYEE
# ─────────────────────────────────────────────────────────────

@router.post("")
def create_employee(payload: EmployeeCreateRequest, db: Session = Depends(get_db)):
    """
    POST /api/employees
    Creates a new employee record.
    """
    try:
        employee = employee_service.create_employee(db, payload)
        return JSONResponse(
            status_code=201,
            content=success_response("Employee created successfully", {"id": employee.id, "employee_id": employee.employee_id})
        )
    except Exception as exc:
        traceback.print_exc()
        return JSONResponse(status_code=500, content=error_response(str(exc)))

# ─────────────────────────────────────────────────────────────
# LIST EMPLOYEES
# ─────────────────────────────────────────────────────────────

@router.get("")
def list_employees(
    search: Optional[str] = Query(None, description="Search by name, ID, or designation"),
    status: Optional[str] = Query(None, description="Filter by Active or Inactive"),
    db: Session = Depends(get_db)
):
    """
    GET /api/employees
    Returns a list of all employees based on optional filters.
    """
    try:
        employees = employee_service.get_all_employees(db, search=search, status=status)
        
        # Format the data before sending it back
        data = [
            {
                "id": emp.id,
                "employee_id": emp.employee_id,
                "first_name": emp.first_name,
                "last_name": emp.last_name,
                "preferred_name": emp.preferred_name,
                "designation": emp.designation,
                "date_of_joining": str(emp.date_of_joining) if emp.date_of_joining else None,
                "package": emp.package,
                "status": emp.status,
                "last_working_date": str(emp.last_working_date) if emp.last_working_date else None,
            }
            for emp in employees
        ]
        
        return JSONResponse(
            status_code=200,
            content=success_response("Employees fetched successfully", data)
        )
    except Exception as exc:
        traceback.print_exc()
        return JSONResponse(status_code=500, content=error_response(str(exc)))

# ─────────────────────────────────────────────────────────────
# GET SINGLE EMPLOYEE
# ─────────────────────────────────────────────────────────────

@router.get("/{employee_id}")
def get_employee(employee_id: int, db: Session = Depends(get_db)):
    """
    GET /api/employees/{id}
    Returns a single employee's full details.
    """
    try:
        employee = employee_service.get_employee_by_id(db, employee_id)
        if not employee:
            return JSONResponse(status_code=404, content=error_response("Employee not found"))
            
        data = {
            "id": employee.id,
            "employee_id": employee.employee_id,
            "first_name": employee.first_name,
            "last_name": employee.last_name,
            "preferred_name": employee.preferred_name,
            "designation": employee.designation,
            "date_of_joining": str(employee.date_of_joining) if employee.date_of_joining else None,
            "package": employee.package,
            "status": employee.status,
            "last_working_date": str(employee.last_working_date) if employee.last_working_date else None,
        }
        
        return JSONResponse(
            status_code=200,
            content=success_response("Employee fetched successfully", data)
        )
    except Exception as exc:
        traceback.print_exc()
        return JSONResponse(status_code=500, content=error_response(str(exc)))

# ─────────────────────────────────────────────────────────────
# UPDATE EMPLOYEE
# ─────────────────────────────────────────────────────────────

@router.put("/{employee_id}")
def update_employee(
    employee_id: int, 
    payload: EmployeeUpdateRequest, 
    db: Session = Depends(get_db)
):
    """
    PUT /api/employees/{id}
    Updates an existing employee.
    """
    try:
        employee = employee_service.update_employee(db, employee_id, payload)
        if not employee:
            return JSONResponse(status_code=404, content=error_response("Employee not found"))
            
        return JSONResponse(
            status_code=200,
            content=success_response("Employee updated successfully", {"id": employee.id})
        )
    except Exception as exc:
        traceback.print_exc()
        return JSONResponse(status_code=500, content=error_response(str(exc)))

# ─────────────────────────────────────────────────────────────
# DELETE EMPLOYEE
# ─────────────────────────────────────────────────────────────

@router.delete("/{employee_id}")
def delete_employee(employee_id: int, db: Session = Depends(get_db)):
    """
    DELETE /api/employees/{id}
    Deletes an employee from the system.
    """
    try:
        success = employee_service.delete_employee(db, employee_id)
        if not success:
            return JSONResponse(status_code=404, content=error_response("Employee not found"))
            
        return JSONResponse(
            status_code=200,
            content=success_response("Employee deleted successfully")
        )
    except Exception as exc:
        traceback.print_exc()
        return JSONResponse(status_code=500, content=error_response(str(exc)))
