from datetime import datetime, date
from pydantic import BaseModel, Field, field_validator, model_validator
from typing import Optional

class OrganizationCreate(BaseModel):
    organization_name: str = Field(..., min_length=1)
    status: str = Field(default="active")
    contract_signed_date: Optional[date] = None
    contract_end_date: Optional[date] = None
    commission_percentage: float = Field(..., ge=0, le=100)
    contact_number: Optional[str] = Field(None, pattern=r'^\d*$')
    country_code: Optional[str] = Field(None)
    address: Optional[str] = None

    @field_validator("organization_name", mode="before")
    @classmethod
    def strip_name(cls, v: str) -> str:
        if isinstance(v, str):
            return v.strip()
        return v
        
    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str) -> str:
        allowed = {'active', 'complete', 'cancel'}
        if v not in allowed:
            raise ValueError(f"Invalid status. Allowed: {', '.join(allowed)}")
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
    commission_percentage: Optional[float] = Field(None, ge=0, le=100)
    contact_number: Optional[str] = Field(None, pattern=r'^\d*$')
    country_code: Optional[str] = Field(None)
    address: Optional[str] = None

    @model_validator(mode='after')
    def validate_dates(self) -> 'OrganizationUpdate':
        if self.contract_signed_date and self.contract_end_date:
            if self.contract_end_date <= self.contract_signed_date:
                raise ValueError("Contract end date must be after signed date")
        return self

class OrganizationResponse(BaseModel):
    id: int
    organization_id: str
    organization_name: str
    status: str
    contract_signed_date: Optional[date] = None
    contract_end_date: Optional[date] = None
    commission_percentage: Optional[float] = None
    contact_number: Optional[str] = None
    country_code: Optional[str] = None
    address: Optional[str] = None
    is_active: int
    created_at: datetime
    updated_at: datetime
    
    model_config = {
        "from_attributes": True
    }
