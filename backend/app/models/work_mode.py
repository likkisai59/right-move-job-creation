from sqlalchemy import Column, Integer, String, Boolean
from app.core.database import Base

class WorkMode(Base):
    """
    Represents an employee work mode master data record.
    Table name: work_modes
    """
    __tablename__ = "work_modes"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(100), unique=True, nullable=False, index=True)
    is_active = Column(Boolean, default=True, nullable=False)
