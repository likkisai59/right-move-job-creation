from datetime import datetime
from pydantic import BaseModel, Field, field_validator
from typing import Optional

class OrganizationCreate(BaseModel):
    name: str = Field(..., min_length=1, description="Name of the organization")
    status: Optional[str] = Field(default="ACTIVE", description="STATUS: ACTIVE | INACTIVE")

    @field_validator("name", mode="before")
    @classmethod
    def strip_strings(cls, v: str) -> str:
        if isinstance(v, str):
            return v.strip()
        return v
        
    @field_validator("status", mode="before")
    @classmethod
    def validate_status(cls, v: str) -> str:
        if v is None:
            return "ACTIVE"
        normalized = str(v).strip().upper()
        if normalized not in {"ACTIVE", "INACTIVE"}:
            raise ValueError("Invalid status. Allowed: ACTIVE, INACTIVE")
        return normalized

class OrganizationResponse(BaseModel):
    id: int
    name: str
    status: str
    created_at: datetime
    updated_at: datetime
    
    model_config = {
        "from_attributes": True
    }
