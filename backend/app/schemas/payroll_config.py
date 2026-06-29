from pydantic import BaseModel

class PayrollConfigBase(BaseModel):
    pf_percentage: float = 12.0
    tds_percentage: float = 10.0

class PayrollConfigUpdate(BaseModel):
    pf_percentage: float
    tds_percentage: float

class PayrollConfigResponse(PayrollConfigBase):
    id: int

    model_config = {
        "from_attributes": True
    }
