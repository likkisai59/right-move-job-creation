from sqlalchemy import Column, Integer, String, Date, DateTime, func
from app.database import Base

class Job(Base):
    __tablename__ = "jobs"
    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, index=True)
    company_name = Column(String(255), index=True)
    job_title = Column(String(255))
    num_candidates = Column(Integer, default=0)
    experience = Column(String(100))
    budget = Column(String(100))
    assigned_to = Column(String(255))
    created_at = Column(DateTime, server_default=func.now())
