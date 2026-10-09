from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base


class EmployeeOptionalHoliday(Base):
    """
    Tracks which optional holidays an employee has selected.
    Max 2 per year per employee logic is handled in the service/routes.
    """
    __tablename__ = "employee_optional_holidays"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    optional_holiday_id = Column(Integer, ForeignKey("optional_holidays.id"), nullable=False)
    selected_on = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint('employee_id', 'optional_holiday_id', name='unique_emp_holiday'),
    )
