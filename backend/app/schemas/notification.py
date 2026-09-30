from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class NotificationBase(BaseModel):
    message: str
    link: Optional[str] = None
    is_read: bool = False

class NotificationResponse(NotificationBase):
    id: int
    employee_name: str
    created_at: datetime

    class Config:
        from_attributes = True
