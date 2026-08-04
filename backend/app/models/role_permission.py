# models/role_permission.py
from sqlalchemy import Column, Integer, String, JSON
from app.core.database import Base

class RolePermission(Base):
    """
    Stores system roles and their permission matrix.
    Table name: role_permissions
    """
    __tablename__ = "role_permissions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    role_name = Column(String(50), unique=True, nullable=False, index=True)
    display_name = Column(String(100), nullable=False)
    permissions = Column(JSON, nullable=False)

# Excel Matrix Default Definitions
DEFAULT_ROLE_PERMISSIONS = {
    "user": {
        "display_name": "User",
        "candidate": "all_access",
        "job": "all_access",
        "organization": "not_visible",
        "rmep": "add",
        "employee": "not_visible",
        "accounts": "not_visible",
        "settings": "not_visible"
    },
    "leader": {
        "display_name": "Leader",
        "candidate": "all_access",
        "job": "all_access",
        "organization": "not_visible",
        "rmep": "add_edit_approval",
        "employee": "not_visible",
        "accounts": "not_visible",
        "settings": "not_visible"
    },
    "hr": {
        "display_name": "HR",
        "candidate": "view",
        "job": "view",
        "organization": "view",
        "rmep": "add",
        "employee": "add_edit_hr",
        "accounts": "not_visible",
        "settings": "not_visible"
    },
    "admin_user": {
        "display_name": "Admin User",
        "candidate": "dashboard_access",
        "job": "all_access",
        "organization": "add",
        "rmep": "add_edit_approval",
        "employee": "add_edit_admin",
        "accounts": "all_access",
        "settings": "not_visible"
    },
    "admin_admin": {
        "display_name": "Admin Admin",
        "candidate": "view",
        "job": "view_add_rate_incentive",
        "organization": "all_access",
        "rmep": "add_edit_approval_holidays",
        "employee": "dashboard_access",
        "accounts": "all_access",
        "settings": "view_assign_roles"
    },
    "super_admin": {
        "display_name": "Super Admin",
        "candidate": "view",
        "job": "view",
        "organization": "dashboard_access",
        "rmep": "add_edit_approval_holidays",
        "employee": "view_password_access",
        "accounts": "all_access",
        "settings": "all_access"
    },
    "unassigned": {
        "display_name": "Unassigned (Zero Access)",
        "candidate": "not_visible",
        "job": "not_visible",
        "organization": "not_visible",
        "rmep": "not_visible",
        "employee": "not_visible",
        "accounts": "not_visible",
        "settings": "not_visible"
    }
}
