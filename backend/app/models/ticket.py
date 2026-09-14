from sqlalchemy import Column, Integer, String, Date, Text, func
from app.core.database import Base

class Ticket(Base):
    __tablename__ = "tickets"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    description = Column(Text, nullable=False)
    status = Column(String(50), nullable=False, default="OPEN")  # OPEN, RESOLVED
    
    raised_by = Column(String(100), nullable=False, index=True) # Employee ID
    assigned_to = Column(String(100), nullable=False, index=True) # Employee ID
    
    raised_on = Column(Date, nullable=False, server_default=func.current_date())
    resolved_by = Column(String(100), nullable=True) # Employee ID
    resolved_on = Column(Date, nullable=True)
