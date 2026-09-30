from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.models.notification import Notification
from app.schemas.notification import NotificationResponse
from app.utils.response import success_response, error_response

router = APIRouter(
    prefix="/api/notifications",
    tags=["notifications"]
)

@router.get("/{employee_name}", response_model=None)
def get_unread_notifications(employee_name: str, db: Session = Depends(get_db)):
    try:
        notifications = db.query(Notification).filter(
            Notification.employee_name == employee_name,
            Notification.is_read == False
        ).order_by(Notification.created_at.desc()).all()
        
        # Serialize with Pydantic
        results = [NotificationResponse.model_validate(n).model_dump() for n in notifications]
        return success_response("Unread notifications fetched", results)
    except Exception as exc:
        return error_response(f"Failed to fetch notifications: {str(exc)}")

@router.put("/{notification_id}/read", response_model=None)
def mark_notification_as_read(notification_id: int, db: Session = Depends(get_db)):
    try:
        notification = db.query(Notification).filter(Notification.id == notification_id).first()
        if not notification:
            return error_response("Notification not found")
        
        notification.is_read = True
        db.commit()
        return success_response("Notification marked as read")
    except Exception as exc:
        return error_response(f"Failed to update notification: {str(exc)}")
