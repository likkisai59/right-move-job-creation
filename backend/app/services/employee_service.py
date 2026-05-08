from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import or_, func

from app.models.employee import Employee
from app.schemas.employee import EmployeeCreateRequest, EmployeeUpdateRequest

# ─────────────────────────────────────────────────────────────
# INTERNAL HELPER
# ─────────────────────────────────────────────────────────────

def generate_employee_id(db: Session) -> str:
    """
    Auto-generates the next employee ID in the format EMP0001.
    """
    # Find the maximum 'id' in the table
    max_id = db.query(func.max(Employee.id)).scalar() or 0
    next_number = max_id + 1
    return f"EMP{next_number:04d}"

# ─────────────────────────────────────────────────────────────
# CREATE
# ─────────────────────────────────────────────────────────────

def create_employee(db: Session, payload: EmployeeCreateRequest) -> Employee:
    """
    Creates a new employee record.
    """
    emp_code = generate_employee_id(db)
    
    new_employee = Employee(
        employee_id=emp_code,
        first_name=payload.first_name,
        last_name=payload.last_name,
        preferred_name=payload.preferred_name,
        blood_group=payload.blood_group,
        gender=payload.gender,
        country_code=payload.country_code,
        contact_number=payload.contact_number,
        email=payload.email,
        permanent_address=payload.permanent_address,
        current_address=payload.current_address,
        designation=payload.designation,
        date_of_joining=payload.date_of_joining,
        package=payload.package,
        status=payload.status,
        last_working_date=payload.last_working_date
    )
    
    db.add(new_employee)
    db.commit()
    db.refresh(new_employee)
    return new_employee

# ─────────────────────────────────────────────────────────────
# READ (LIST ALL)
# ─────────────────────────────────────────────────────────────

def get_all_employees(
    db: Session, 
    search: Optional[str] = None, 
    status: Optional[str] = None,
    designation: Optional[str] = None,
    min_package: Optional[float] = None,
    max_package: Optional[float] = None,
    blood_group: Optional[str] = None
) -> List[Employee]:
    """
    Fetches all employees with optional search and filters.
    """
    query = db.query(Employee)

    if search:
        search_term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Employee.employee_id.ilike(search_term),
                Employee.first_name.ilike(search_term),
                Employee.last_name.ilike(search_term),
                Employee.designation.ilike(search_term)
            )
        )

    if status and status.upper() != "ALL":
        query = query.filter(Employee.status == status)
        
    if designation:
        query = query.filter(Employee.designation == designation)
        
    if min_package is not None:
        query = query.filter(Employee.package >= min_package)
        
    if max_package is not None:
        query = query.filter(Employee.package <= max_package)
        
    if blood_group:
        query = query.filter(Employee.blood_group == blood_group)

    # Sort newest first by primary key
    return query.order_by(Employee.id.desc()).all()

import openpyxl
from io import BytesIO

def export_employees_to_excel(employees: List[Employee]) -> BytesIO:
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Employees"

    # Header containing all db fields
    headers = [
        "ID", "Employee ID", "First Name", "Last Name", "Preferred Name",
        "Blood Group", "Gender", "Country Code", "Contact Number", "Email",
        "Permanent Address", "Current Address", "Designation", "Date of Joining",
        "Package (LPA)", "Status", "Last Working Date"
    ]
    ws.append(headers)

    # Style Header
    for cell in ws[1]:
        cell.font = openpyxl.styles.Font(bold=True)
        cell.fill = openpyxl.styles.PatternFill(start_color="CCE5FF", end_color="CCE5FF", fill_type="solid")

    # Data
    for emp in employees:
        ws.append([
            emp.id,
            emp.employee_id,
            emp.first_name,
            emp.last_name,
            emp.preferred_name or "",
            emp.blood_group or "",
            emp.gender or "",
            emp.country_code or "",
            emp.contact_number or "",
            emp.email or "",
            emp.permanent_address or "",
            emp.current_address or "",
            emp.designation,
            emp.date_of_joining.strftime("%Y-%m-%d") if emp.date_of_joining else "",
            float(emp.package) if emp.package else 0.0,
            emp.status,
            emp.last_working_date.strftime("%Y-%m-%d") if emp.last_working_date else ""
        ])

    # Adjust column widths
    for column_cells in ws.columns:
        length = max((len(str(cell.value)) for cell in column_cells if cell.value is not None), default=10)
        ws.column_dimensions[column_cells[0].column_letter].width = length + 2

    output = BytesIO()
    wb.save(output)
    output.seek(0)
    return output

# ─────────────────────────────────────────────────────────────
# READ (GET ONE)
# ─────────────────────────────────────────────────────────────

def get_employee_by_id(db: Session, db_id: int) -> Optional[Employee]:
    """
    Fetches a single employee by their database primary key (id).
    """
    return db.query(Employee).filter(Employee.id == db_id).first()

# ─────────────────────────────────────────────────────────────
# UPDATE
# ─────────────────────────────────────────────────────────────

def update_employee(
    db: Session, 
    db_id: int, 
    payload: EmployeeUpdateRequest
) -> Optional[Employee]:
    """
    Updates an existing employee. Only updates fields that were provided.
    """
    employee = db.query(Employee).filter(Employee.id == db_id).first()
    
    if not employee:
        return None

    # payload.model_dump(exclude_unset=True) returns a dictionary of only 
    # the fields the frontend actually sent.
    update_data = payload.model_dump(exclude_unset=True)
    
    for key, value in update_data.items():
        setattr(employee, key, value)

    db.commit()
    db.refresh(employee)
    return employee

# ─────────────────────────────────────────────────────────────
# DELETE
# ─────────────────────────────────────────────────────────────

def delete_employee(db: Session, db_id: int) -> bool:
    """
    Deletes an employee from the database.
    """
    employee = db.query(Employee).filter(Employee.id == db_id).first()
    
    if not employee:
        return False
        
    db.delete(employee)
    db.commit()
    return True
