from sqlalchemy import Column, Integer, String, Boolean
from app.core.database import Base

class BusinessUnit(Base):
    """
    Represents an employee business unit master data record.
    Table name: business_units
    """
    __tablename__ = "business_units"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(100), unique=True, nullable=False, index=True)
    is_active = Column(Boolean, default=True, nullable=False)
