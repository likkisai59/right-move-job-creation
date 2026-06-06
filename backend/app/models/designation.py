from sqlalchemy import Column, Integer, String, Boolean, Text
from app.core.database import Base

class Designation(Base):
    """
    Represents an employee designation master data record.
    Table name: designations
    """
    __tablename__ = "designations"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(100), unique=True, nullable=False, index=True)
    is_active = Column(Boolean, default=True, nullable=False)
    leaves = Column(Integer, default=30, nullable=False)
    holidays = Column(Text, nullable=True)

