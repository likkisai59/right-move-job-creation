from datetime import datetime, date
from pydantic import BaseModel, Field, field_validator, model_validator
from typing import Optional

class OrganizationCreate(BaseModel):
    organization_name: str = Field(..., min_length=1)
    status: str = Field(..., min_length=1)
    contract_signed_date: Optional[date] = None
    contract_end_date: Optional[date] = None
    contract_document_url: Optional[str] = None
    contact_number: Optional[str] = None
    country_code: Optional[str] = Field(None)
    band: str = Field(..., min_length=1)
    rate: str = Field(..., min_length=1)
    poc_name: Optional[str] = None
    poc_country_code: Optional[str] = Field(None)
    poc_contact: Optional[str] = Field(None)
    poc_email_id: Optional[str] = None
    location: Optional[str] = None
    gst_number: Optional[str] = None
    cgst: Optional[float] = 0.0
    sgst: Optional[float] = 0.0
    igst: Optional[float] = 0.0

    @field_validator("organization_name", mode="before")
    @classmethod
    def strip_name(cls, v: str) -> str:
        if isinstance(v, str):
            return v.strip()
        return v
        
    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str) -> str:
        allowed = {'active', 'inactive'}
        if v not in allowed:
            raise ValueError(f"Invalid status. Allowed: {', '.join(allowed)}")
        return v

    @field_validator("contact_number", mode="before")
    @classmethod
    def validate_contact_number(cls, v):
        if v and str(v).strip():
            val = str(v).strip()
            import re
            if not re.match(r"^\d{10}$", val):
                raise ValueError("Contact number must be exactly 10 digits")
            return val
        return v or None

    @field_validator("poc_contact", mode="before")
    @classmethod
    def validate_poc_phone(cls, v):
        if v and str(v).strip():
            val = str(v).strip()
            import re
            phones = [p.strip() for p in val.split(',') if p.strip()]
            for phone in phones:
                if not re.match(r"^\d{10}$", phone):
                    raise ValueError("POC contact number must be exactly 10 digits")
            return ', '.join(phones)
        return v or None

    @field_validator("poc_email_id", mode="before")
    @classmethod
    def validate_org_email(cls, v):
        if v and str(v).strip():
            val = str(v).strip()
            from app.utils.email_validator import validate_and_normalize_email
            normalized_emails = []
            for email in val.split(','):
                email = email.strip()
                if email:
                    normalized_emails.append(validate_and_normalize_email(email))
            return ', '.join(normalized_emails)
        return v

    @field_validator("gst_number", mode="before")
    @classmethod
    def validate_gst(cls, v):
        if v and str(v).strip():
            val = str(v).strip()
            import re
            if not re.match(r"^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$", val):
                raise ValueError("Invalid GST Number format (e.g. 36ABCDE1234F1Z5)")
        return v

    @model_validator(mode='after')
    def validate_dates(self) -> 'OrganizationCreate':
        if self.contract_signed_date and self.contract_end_date:
            if self.contract_end_date <= self.contract_signed_date:
                raise ValueError("Contract end date must be after signed date")
        return self

class OrganizationUpdate(BaseModel):
    organization_name: Optional[str] = None
    status: Optional[str] = None
    contract_signed_date: Optional[date] = None
    contract_end_date: Optional[date] = None
    contract_document_url: Optional[str] = None
    contact_number: Optional[str] = None
    country_code: Optional[str] = Field(None)
    band: Optional[str] = None
    rate: Optional[str] = None
    poc_name: Optional[str] = None
    poc_country_code: Optional[str] = Field(None)
    poc_contact: Optional[str] = Field(None)
    poc_email_id: Optional[str] = None
    location: Optional[str] = None
    gst_number: Optional[str] = None
    cgst: Optional[float] = None
    sgst: Optional[float] = None
    igst: Optional[float] = None

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            allowed = {'active', 'inactive'}
            if v not in allowed:
                raise ValueError(f"Invalid status. Allowed: {', '.join(allowed)}")
        return v

    @field_validator("contact_number", mode="before")
    @classmethod
    def validate_contact_number(cls, v):
        if v and str(v).strip():
            val = str(v).strip()
            import re
            if not re.match(r"^\d{10}$", val):
                raise ValueError("Contact number must be exactly 10 digits")
            return val
        return v or None

    @field_validator("poc_contact", mode="before")
    @classmethod
    def validate_poc_phone(cls, v):
        if v and str(v).strip():
            val = str(v).strip()
            import re
            phones = [p.strip() for p in val.split(',') if p.strip()]
            for phone in phones:
                if not re.match(r"^\d{10}$", phone):
                    raise ValueError("POC contact number must be exactly 10 digits")
            return ', '.join(phones)
        return v or None

    @field_validator("gst_number", mode="before")
    @classmethod
    def validate_gst(cls, v):
        if v and str(v).strip():
            val = str(v).strip()
            import re
            if not re.match(r"^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$", val):
                raise ValueError("Invalid GST Number format (e.g. 36ABCDE1234F1Z5)")
        return v

    @field_validator("poc_email_id", mode="before")
    @classmethod
    def validate_org_email(cls, v):
        if v and str(v).strip():
            val = str(v).strip()
            from app.utils.email_validator import validate_and_normalize_email
            normalized_emails = []
            for email in val.split(','):
                email = email.strip()
                if email:
                    normalized_emails.append(validate_and_normalize_email(email))
            return ', '.join(normalized_emails)
        return v

    @model_validator(mode='after')
    def validate_dates(self) -> 'OrganizationUpdate':
        if self.contract_signed_date and self.contract_end_date:
            if self.contract_end_date <= self.contract_signed_date:
                raise ValueError("Contract end date must be after signed date")
        return self

class OrganizationResponse(BaseModel):
    id: int
    organization_id: Optional[str] = None
    organization_name: Optional[str] = None
    status: Optional[str] = None
    contract_signed_date: Optional[date] = None
    contract_end_date: Optional[date] = None
    contract_document_url: Optional[str] = None
    contact_number: Optional[str] = None
    country_code: Optional[str] = None
    is_active: Optional[int] = None
    band: Optional[str] = None
    rate: Optional[str] = None
    poc_name: Optional[str] = None
    poc_country_code: Optional[str] = None
    poc_contact: Optional[str] = None
    poc_email_id: Optional[str] = None
    location: Optional[str] = None
    gst_number: Optional[str] = None
    cgst: Optional[float] = None
    sgst: Optional[float] = None
    igst: Optional[float] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    model_config = {
        "from_attributes": True
    }
