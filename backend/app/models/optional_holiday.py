from sqlalchemy import Column, Integer, String, Date, Boolean, Text
from app.core.database import Base


class OptionalHoliday(Base):
    """
    Represents an optional holiday configured by admin.
    Employees can view these; no employee selection required.
    Table name: optional_holidays
    """
    __tablename__ = "optional_holidays"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(150), nullable=False)
    date = Column(Date, nullable=False)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
