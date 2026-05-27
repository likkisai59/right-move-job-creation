from pydantic import BaseModel, Field
from typing import Optional

class DesignationCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)

class DesignationUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    is_active: Optional[bool] = None

class DesignationResponse(BaseModel):
    id: int
    name: str
    is_active: bool

    model_config = {
        "from_attributes": True
    }
