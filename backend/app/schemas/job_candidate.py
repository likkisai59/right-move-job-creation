from pydantic import BaseModel
from typing import Optional

class CandidateActionRequest(BaseModel):
    candidate_id: int
