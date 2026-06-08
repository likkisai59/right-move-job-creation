from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
import json

class DesignationCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)

class DesignationUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    is_active: Optional[bool] = None

class DesignationResponse(BaseModel):
    id: int
    name: str
    is_active: bool
    leaves: Optional[float] = 30.0
    holidays: Optional[List[dict]] = None

    @field_validator("holidays", mode="before")
    @classmethod
    def parse_holidays_json(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except Exception:
                return []
        return v

    model_config = {
        "from_attributes": True
    }

