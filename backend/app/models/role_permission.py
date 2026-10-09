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
        "job": "mapping_only",
        "organization": "not_visible",
        "rmep": "apply_leaves_raise_tickets",
        "employee": "not_visible",
        "accounts": "not_visible",
        "settings": "not_visible"
    },
    "leader": {
        "display_name": "Leader",
        "candidate": "all_access",
        "job": "all_access",
        "organization": "not_visible",
        "rmep": "apply_leaves_raise_tickets_approval",
        "employee": "not_visible",
        "accounts": "not_visible",
        "settings": "not_visible"
    },
    "admin_user": {
        "display_name": "Admin User",
        "candidate": "not_visible",
        "job": "not_visible",
        "organization": "add",
        "rmep": "apply_approve_leaves_tickets",
        "employee": "add_edit_admin_delete",
        "accounts": "not_visible",
        "settings": "not_visible"
    },
    "admin_admin": {
        "display_name": "Admin Admin",
        "candidate": "not_visible",
        "job": "not_visible",
        "organization": "all_access",
        "rmep": "all_access",
        "employee": "all_access",
        "accounts": "view",
        "settings": "all_access"
    },
    "super_admin": {
        "display_name": "Super Admin",
        "candidate": "all_access",
        "job": "all_access",
        "organization": "all_access",
        "rmep": "all_access",
        "employee": "all_access",
        "accounts": "all_access",
        "settings": "all_access"
    },
    "hr": {
        "display_name": "HR",
        "candidate": "not_visible",
        "job": "not_visible",
        "organization": "not_visible",
        "rmep": "apply_leaves_approve_tickets",
        "employee": "add_edit_hr_delete",
        "accounts": "not_visible",
        "settings": "not_visible"
    },
    "account_user": {
        "display_name": "Account User",
        "candidate": "not_visible",
        "job": "not_visible",
        "organization": "view",
        "rmep": "apply_leaves_approve_tickets",
        "employee": "view",
        "accounts": "all_access",
        "settings": "not_visible"
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
    },
    "temporary": {
        "display_name": "Temporary",
        "candidate": "add_edit",
        "job": "not_visible",
        "organization": "not_visible",
        "rmep": "apply_leaves",
        "employee": "not_visible",
        "accounts": "not_visible",
        "settings": "not_visible"
    }
}
