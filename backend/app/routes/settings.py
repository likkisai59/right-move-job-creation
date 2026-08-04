from fastapi import APIRouter, status, Depends, HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from typing import List, Optional

from app.core.database import get_db
from app.models.employee import Employee
from app.models.role_permission import RolePermission, DEFAULT_ROLE_PERMISSIONS
from app.core.security import require_roles, get_current_user_system_role
from app.utils.response import success_response, error_response

router = APIRouter(prefix="/api/settings", tags=["Settings & RBAC"])

class AssignRoleRequest(BaseModel):
    employee_id: int = Field(..., description="ID of the employee")
    system_role: str = Field(..., description="Role to assign: user, leader, hr, admin_user, admin_admin, super_admin, unassigned")

@router.get("/roles")
def get_all_employee_roles(
    db: Session = Depends(get_db),
    current_role: str = Depends(require_roles(["admin_admin", "super_admin"]))
):
    """
    Fetch all active/inactive employees and their assigned system roles.
    Restricted to Admin Admin and Super Admin.
    """
    employees = db.query(Employee).order_by(Employee.id.desc()).all()
    result = []
    for emp in employees:
        result.append({
            "id": emp.id,
            "employee_id": emp.employee_id,
            "name": f"{emp.first_name or ''} {emp.last_name or ''}".strip() or "Unnamed",
            "designation": emp.designation or "Not Assigned",
            "email": emp.email or "",
            "system_role": emp.system_role or "unassigned",
            "status": emp.status or "Active",
            "profile_status": emp.profile_status or "Draft"
        })
    return JSONResponse(status_code=status.HTTP_200_OK, content=success_response("Employee roles fetched successfully", result))

@router.post("/assign-role")
def assign_employee_role(
    payload: AssignRoleRequest,
    db: Session = Depends(get_db),
    current_role: str = Depends(require_roles(["admin_admin", "super_admin"]))
):
    """
    Assign a system role to an employee.
    Restricted to Admin Admin and Super Admin.
    """
    allowed = {"user", "leader", "hr", "admin_user", "admin_admin", "super_admin", "unassigned"}
    role_to_assign = payload.system_role.strip().lower()
    
    if role_to_assign not in allowed:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content=error_response(f"Invalid role. Allowed roles: {', '.join(sorted(allowed))}")
        )
        
    emp = db.query(Employee).filter(Employee.id == payload.employee_id).first()
    if not emp:
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content=error_response("Employee not found")
        )
        
    emp.system_role = role_to_assign
    db.commit()
    db.refresh(emp)
    
    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content=success_response(f"Successfully assigned role '{role_to_assign}' to employee {emp.first_name} {emp.last_name}.", {
            "id": emp.id,
            "employee_id": emp.employee_id,
            "system_role": emp.system_role
        })
    )

@router.get("/matrix")
def get_permission_matrix(
    current_role: str = Depends(get_current_user_system_role)
):
    """
    Fetch full 7-Role x 7-Module permission matrix.
    """
    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content=success_response("Permission matrix fetched", DEFAULT_ROLE_PERMISSIONS)
    )
