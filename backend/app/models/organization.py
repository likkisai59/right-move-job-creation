from sqlalchemy import Column, Integer, String, DateTime, Enum as SAEnum, func, Date, Numeric
from app.core.database import Base


class Organization(Base):
    __tablename__ = "organizations"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    organization_id = Column(String(20), unique=True, nullable=False, index=True)
    organization_name = Column(String(255), unique=True, nullable=False, index=True)

    status = Column(
        SAEnum('in_progress', 'completed', 'rejected', 'cancel', name="org_status_enum"),
        nullable=False,
        default='in_progress',
    )

    contract_signed_date = Column(Date, nullable=True)
    contract_end_date = Column(Date, nullable=True)
    commission_percentage = Column(Numeric(5, 2), nullable=True)
    is_active = Column(Integer, nullable=False, default=1) # Using Integer (0/1) for boolean for better compatibility or just Boolean

    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())
