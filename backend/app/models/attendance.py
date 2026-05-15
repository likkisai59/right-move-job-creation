from sqlalchemy import Column, Integer, String, Date, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class Attendance(Base):
    """
    Model for tracking daily attendance of employees.
    """
    __tablename__ = "attendance"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    attendance_date = Column(Date, nullable=False)
    status = Column(String(10), nullable=False)  # P, A, L, H
    work_mode = Column(String(20), nullable=False) # WFH, Office, Hybrid

    # Relationship back to employee
    employee = relationship("Employee", back_populates="attendance_records")
