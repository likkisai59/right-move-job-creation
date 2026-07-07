from fastapi import APIRouter, Depends, Query, File, UploadFile
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from typing import Optional
import traceback
import os
import shutil
from datetime import datetime

from app.core.database import get_db
from app.utils.response import success_response, error_response
from app.schemas.employee import EmployeeCreateRequest, EmployeeUpdateRequest
from app.services import employee_service
from app.models.employee import Employee

# Define the router prefix for all endpoints in this file
router = APIRouter(prefix="/api/employees", tags=["Employees"])

# ─────────────────────────────────────────────────────────────
# SERIALIZE EMPLOYEE HELPER
# ─────────────────────────────────────────────────────────────

def serialize_employee(emp: Employee) -> dict:
    """
    Helper function to serialize an Employee model to a dict,
    ensuring all database fields are correctly serialized and sent to the frontend.
    """
    if not emp:
        return {}
    return {
        "id": emp.id,
        "employee_id": emp.employee_id,
        "first_name": emp.first_name,
        "last_name": emp.last_name,
        "blood_group": emp.blood_group,
        "gender": emp.gender,
        "country_code": emp.country_code,
        "contact_number": emp.contact_number,
        "email": emp.email,
        "permanent_address": emp.permanent_address,
        "current_address": emp.current_address,
        "designation": emp.designation,
        "date_of_joining": str(emp.date_of_joining) if emp.date_of_joining else None,
        "package": emp.package,
        "status": emp.status,
        "profile_status": emp.profile_status,
        "completion_percentage": emp.completion_percentage,
        "profile_status_hr": emp.profile_status_hr,
        "completion_percentage_hr": emp.completion_percentage_hr,
        "profile_status_admin": emp.profile_status_admin,
        "completion_percentage_admin": emp.completion_percentage_admin,
        "employee_password": emp.employee_password,
        "last_working_date": str(emp.last_working_date) if emp.last_working_date else None,
        "date": str(emp.date) if emp.date else None,
        
        # Additional fields
        "date_of_birth": str(emp.date_of_birth) if emp.date_of_birth else None,
        "countrycode_office_contact": emp.countrycode_office_contact,
        "contact_number_office": emp.contact_number_office,
        "countrycode_emergency_contact": emp.countrycode_emergency_contact,
        "emergency_contact_number": emp.emergency_contact_number,
        "aadhar_number": emp.aadhar_number,
        "aadhar_url": emp.aadhar_url,
        "pan_number": emp.pan_number,
        "pan_url": emp.pan_url,
        "marksheet_10th_url": emp.marksheet_10th_url,
        "marksheet_12th_url": emp.marksheet_12th_url,
        "marksheet_graduation_url": emp.marksheet_graduation_url,
        "present_address_proof_url": emp.present_address_proof_url,
        "permanent_address_proof_url": emp.permanent_address_proof_url,
        "photo_url": emp.photo_url,
        "medical_condition": emp.medical_condition,
        
        # Document & Experience fields
        "resume_url": emp.resume_url,
        "salary_slips_url": emp.salary_slips_url,
        "offer_letter_url": emp.offer_letter_url,
        "last_company_name": emp.last_company_name,
        
        # Bank Details
        "bank_name": emp.bank_name,
        "bank_account_number": emp.bank_account_number,
        "bank_ifsc_code": emp.bank_ifsc_code,
        
        # Reporting & Compliance Details
        "assigned_business_unit": emp.assigned_business_unit,
        "reporting_to": emp.reporting_to,
        "work_mode": emp.work_mode,
        "ctc": emp.ctc,
        "compliance": emp.compliance,
        
        # Asset & System Configuration Details
        "system_assigned": emp.system_assigned,
        "sim_card_assigned": emp.sim_card_assigned,
        "email_id_configured": emp.email_id_configured,
        "linkedin_configured": emp.linkedin_configured,
        "google_sheet_configured": emp.google_sheet_configured,
        "whatsapp_business_configured": emp.whatsapp_business_configured,
    }

# ─────────────────────────────────────────────────────────────
# FILE UPLOAD
# ─────────────────────────────────────────────────────────────

@router.post("/upload")
def upload_employee_file(file: UploadFile = File(...)):
    """
    POST /api/employees/upload
    Uploads a document or photo for an employee.
    Returns the static URL of the uploaded file.
    """
    try:
        # Create uploads folder if it doesn't exist
        if not os.path.exists("uploads"):
            os.makedirs("uploads")
            
        filename = f"{int(datetime.now().timestamp())}_{file.filename.replace(' ', '_')}"
        filepath = os.path.join("uploads", filename)
        with open(filepath, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        return JSONResponse(
            status_code=200,
            content=success_response(
                "File uploaded successfully", 
                {"url": f"/uploads/{filename}", "filename": file.filename}
            )
        )
    except Exception as exc:
        traceback.print_exc()
        return JSONResponse(
            status_code=500, 
            content=error_response(f"Failed to upload file: {str(exc)}")
        )

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
# EXPORT EMPLOYEES
# ─────────────────────────────────────────────────────────────

from fastapi.responses import StreamingResponse
from datetime import datetime

@router.get("/export")
def export_employees(
    search: Optional[str] = Query(None, description="Search by name, ID, or designation"),
    status: Optional[str] = Query(None, description="Filter by Active or Inactive"),
    designation: Optional[str] = Query(None, description="Filter by designation"),
    min_package: Optional[float] = Query(None, description="Minimum package"),
    max_package: Optional[float] = Query(None, description="Maximum package"),
    blood_group: Optional[str] = Query(None, description="Filter by blood group"),
    sort_by: Optional[str] = Query(None, description="Field to sort by"),
    sort_order: Optional[str] = Query("desc", description="Sort order (asc or desc)"),
    db: Session = Depends(get_db)
):
    """
    GET /api/employees/export
    Exports employees matching filters to an Excel file.
    """
    try:
        employees = employee_service.get_all_employees(
            db, search=search, status=status, designation=designation, 
            min_package=min_package, max_package=max_package, blood_group=blood_group,
            sort_by=sort_by, sort_order=sort_order
        )
        output = employee_service.export_employees_to_excel(employees)
        
        filename = f"employees_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
        
        return StreamingResponse(
            output,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
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
    designation: Optional[str] = Query(None, description="Filter by designation"),
    min_package: Optional[float] = Query(None, description="Minimum package"),
    max_package: Optional[float] = Query(None, description="Maximum package"),
    blood_group: Optional[str] = Query(None, description="Filter by blood group"),
    sort_by: Optional[str] = Query(None, description="Field to sort by"),
    sort_order: Optional[str] = Query("desc", description="Sort order (asc or desc)"),
    db: Session = Depends(get_db)
):
    """
    GET /api/employees
    Returns a list of all employees based on optional filters.
    """
    try:
        employees = employee_service.get_all_employees(
            db, search=search, status=status, designation=designation, 
            min_package=min_package, max_package=max_package, blood_group=blood_group,
            sort_by=sort_by, sort_order=sort_order
        )
        
        # Auto-heal missing passwords for 100% completed profiles
        from app.services.employee_service import compute_employee_completion
        updated_any = False
        for emp in employees:
            if (emp.completion_percentage_hr == 100 and 
                emp.completion_percentage_admin == 100 and 
                not emp.employee_password):
                compute_employee_completion(emp)
                updated_any = True
        if updated_any:
            db.commit()
            for emp in employees:
                db.refresh(emp)
        
        data = [serialize_employee(emp) for emp in employees]
        
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
            
        # Auto-heal password if missing
        if (employee.completion_percentage_hr == 100 and 
            employee.completion_percentage_admin == 100 and 
            not employee.employee_password):
            from app.services.employee_service import compute_employee_completion
            compute_employee_completion(employee)
            db.commit()
            db.refresh(employee)
            
        data = serialize_employee(employee)
        
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
