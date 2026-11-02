from sqlalchemy import Column, Integer, String
from app.core.database import Base

class SystemSetting(Base):
    """
    Represents key-value global system configurations (e.g. max_optional_holidays_per_year).
    Table name: system_settings
    """
    __tablename__ = "system_settings"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    key = Column(String(100), unique=True, nullable=False, index=True)
    value = Column(String(255), nullable=False)

