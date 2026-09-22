from sqlalchemy import Column, Integer, String, Boolean
from app.core.database import Base

class LeaveType(Base):
    """
    Represents a leave type master data record.
    Table name: leave_types
    """
    __tablename__ = "leave_types"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(100), unique=True, nullable=False, index=True)
    is_active = Column(Boolean, default=True, nullable=False)
