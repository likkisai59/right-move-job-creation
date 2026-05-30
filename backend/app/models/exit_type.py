from sqlalchemy import Column, Integer, String, Boolean
from app.core.database import Base

class ExitType(Base):
    """
    Represents an exit type master data record.
    Table name: exit_types
    """
    __tablename__ = "exit_types"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(100), unique=True, nullable=False, index=True)
    is_active = Column(Boolean, default=True, nullable=False)
