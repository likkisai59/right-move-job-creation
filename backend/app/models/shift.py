from sqlalchemy import Column, Integer, String, Time, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class Shift(Base):
    """
    Model for managing employee shift schedules and timings.
    """
    __tablename__ = "shifts"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    shift_name = Column(String(100), nullable=False) # Morning, Night
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    weekly_off = Column(String(50), nullable=False) # e.g. Sunday

    # Relationship back to employee
    employee = relationship("Employee", back_populates="shift_records")
