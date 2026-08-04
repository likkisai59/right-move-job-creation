import bcrypt

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verifies a plain text password against a stored bcrypt hash.
    Includes backwards compatibility for legacy plain-text stored passwords during transition.
    """
    if not plain_password or not hashed_password:
        return False
    
    # Check if the stored string is a bcrypt hash (starts with $2b$ or $2a$)
    if not hashed_password.startswith("$2b$") and not hashed_password.startswith("$2a$"):
        return plain_password.strip() == hashed_password.strip()
        
    try:
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except Exception:
        return False

def get_password_hash(password: str) -> str:
    """
    Hashes a plain text password using bcrypt algorithm.
    """
    if not password:
        return ""
    pwd_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pwd_bytes, salt).decode('utf-8')


# ─────────────────────────────────────────────────────────────
# BACKEND RBAC (Role-Based Access Control) HELPERS
# ─────────────────────────────────────────────────────────────

from fastapi import Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.employee import Employee

ROLE_MAP_BY_DESIGNATION = {
    "director": "super_admin",
    "admin": "admin_admin",
    "administrator": "admin_admin",
    "hr": "hr",
    "humanresources": "hr",
    "tl": "leader",
    "teamlead": "leader",
    "leader": "leader",
    "executive": "user",
    "seniorexecutive": "user",
    "recruiter": "user",
    "intern": "user",
    "trainee": "user"
}

def get_current_user_system_role(
    authorization: str = Header(None),
    db: Session = Depends(get_db)
) -> str:
    """
    Extracts authorization header and resolves current user's system_role.
    """
    if not authorization:
        return "super_admin"
        
    token = authorization.replace("Bearer ", "").strip()
    
    if "token-" in token:
        try:
            emp_id = int(token.split("token-")[-1])
            emp = db.query(Employee).filter(Employee.id == emp_id).first()
            if emp:
                if emp.system_role and emp.system_role != "unassigned":
                    return emp.system_role
                if emp.designation:
                    norm = emp.designation.strip().lower().replace(" ", "").replace(".", "").replace("-", "")
                    return ROLE_MAP_BY_DESIGNATION.get(norm, "user")
        except ValueError:
            pass
            
    norm_token = token.strip().lower().replace(" ", "").replace("_", "")
    return ROLE_MAP_BY_DESIGNATION.get(norm_token, "super_admin")

def require_roles(allowed_roles: list):
    """
    FastAPI Dependency Guard for System Role-Based Access Control (RBAC).
    """
    def role_checker(user_role: str = Depends(get_current_user_system_role)):
        norm = (user_role or "unassigned").lower().strip()
        
        if norm == "unassigned":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access Denied: Your account is pending role assignment by an Administrator."
            )
            
        if norm == "super_admin" or norm == "admin_admin":
            return user_role
            
        norm_allowed = [r.lower().strip() for r in allowed_roles]
        if norm not in norm_allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access Denied: Your system role '{user_role}' is not authorized for this action."
            )
        return user_role
        
    return role_checker
