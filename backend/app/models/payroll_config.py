from sqlalchemy import Column, Integer, Float
from app.core.database import Base

class PayrollConfig(Base):
    """
    Represents the global payroll config details like PF/TDS percentages.
    Table name: payroll_configs
    """
    __tablename__ = "payroll_configs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    pf_percentage = Column(Float, default=12.0, nullable=False)
    tds_percentage = Column(Float, default=10.0, nullable=False)
