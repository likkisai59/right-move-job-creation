from sqlalchemy import Column, Integer, String, Date, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class Leave(Base):
    """
    Model for managing employee leave requests and approvals.
    """
    __tablename__ = "leaves"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    leave_type = Column(String(50), nullable=False) # Sick, Casual, Earned
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    reason = Column(String(500), nullable=True)
    status = Column(String(20), default="Pending") # Pending, Approved, Rejected
    approved_by = Column(String(100), nullable=True) # Manager or Admin name

    # Relationship back to employee
    employee = relationship("Employee", back_populates="leave_records")
