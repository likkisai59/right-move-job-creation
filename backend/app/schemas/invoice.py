from pydantic import BaseModel
from typing import Optional
from datetime import date

class InvoiceBase(BaseModel):
    invoice_number: Optional[str] = None
    invoice_date: Optional[date] = None
    billable_ctc: Optional[float] = 0.0
    gross: Optional[float] = 0.0
    cgst: Optional[float] = 0.0
    sgst: Optional[float] = 0.0
    igst: Optional[float] = 0.0
    total_gst: Optional[float] = 0.0
    billable_amount: Optional[float] = 0.0
    tds_deduction: Optional[float] = 0.0
    deduction: Optional[float] = 0.0
    received_amount: Optional[float] = 0.0
    balance_amount: Optional[float] = 0.0
    received_date: Optional[date] = None
    candidate_status: Optional[str] = None
    billing_status: Optional[str] = "Pending"

class InvoiceUpdate(BaseModel):
    invoice_number: Optional[str] = None
    invoice_date: Optional[date] = None
    billable_ctc: Optional[float] = None
    gross: Optional[float] = None
    cgst: Optional[float] = None
    sgst: Optional[float] = None
    igst: Optional[float] = None
    total_gst: Optional[float] = None
    billable_amount: Optional[float] = None
    tds_deduction: Optional[float] = None
    deduction: Optional[float] = None
    received_amount: Optional[float] = None
    balance_amount: Optional[float] = None
    received_date: Optional[date] = None
    candidate_status: Optional[str] = None
    billing_status: Optional[str] = None

class InvoiceResponse(InvoiceBase):
    id: Optional[int] = None
    job_candidate_mapping_id: int
    
    # Nested candidate & organization details populated on retrieval
    candidate_joined_date: Optional[date] = None
    candidate_name: Optional[str] = None
    job_designation: Optional[str] = None
    organization_name: Optional[str] = None
    location: Optional[str] = None
    offered_ctc: Optional[float] = 0.0
    gst_number: Optional[str] = None

    model_config = {
        "from_attributes": True
    }
