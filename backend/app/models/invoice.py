from sqlalchemy import Column, Integer, String, Float, ForeignKey, Date
from sqlalchemy.orm import relationship
from app.core.database import Base

class Invoice(Base):
    """
    Represents invoicing and billing details for candidate placements.
    Table name: invoices
    """
    __tablename__ = "invoices"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    job_candidate_mapping_id = Column(Integer, ForeignKey("job_candidate_mapping.id", ondelete="CASCADE"), unique=True, nullable=False)
    
    invoice_number = Column(String(50), nullable=True)
    invoice_date = Column(Date, nullable=True)
    billable_ctc = Column(Float, nullable=True, default=0.0)
    gross = Column(Float, nullable=True, default=0.0)
    cgst = Column(Float, nullable=True, default=0.0)
    sgst = Column(Float, nullable=True, default=0.0)
    igst = Column(Float, nullable=True, default=0.0)
    total_gst = Column(Float, nullable=True, default=0.0)
    billable_amount = Column(Float, nullable=True, default=0.0)
    tds_deduction = Column(Float, nullable=True, default=0.0)
    deduction = Column(Float, nullable=True, default=0.0)
    received_amount = Column(Float, nullable=True, default=0.0)
    balance_amount = Column(Float, nullable=True, default=0.0)
    received_date = Column(Date, nullable=True)
    status = Column(String(50), default="Pending") # Pending, Received, Not Served

    # Relationship to JobCandidateMapping
    mapping = relationship("JobCandidateMapping", backref="invoice", uselist=False)
