from sqlalchemy import Column, Integer, String, DateTime, Enum as SAEnum, func
from app.core.database import Base


class Organization(Base):
    __tablename__ = "organizations"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(255), unique=True, nullable=False, index=True)

    status = Column(
        SAEnum("ACTIVE", "INACTIVE", name="org_status_enum"),
        nullable=False,
        default="ACTIVE",
    )

    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())
