from fastapi import APIRouter, Depends, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from typing import List, Optional

from app.core.database import get_db
from app.models.work_mode import WorkMode
from app.models.job_requirement import JobRequirement
from app.models.employee import Employee
from app.models.attendance import Attendance
from app.schemas.work_mode import WorkModeCreate, WorkModeUpdate, WorkModeResponse
from app.utils.response import success_response, error_response

router = APIRouter(prefix="/api/work-modes", tags=["Work Modes"])

@router.get("", response_model=List[WorkModeResponse])
def get_work_modes(active_only: Optional[bool] = None, db: Session = Depends(get_db)):
    """
    Get all work modes.
    Optionally filter by active status.
    """
    try:
        query = db.query(WorkMode)
        if active_only is not None:
            query = query.filter(WorkMode.is_active == active_only)
        
        work_modes = query.order_by(WorkMode.name.asc()).all()
        
        # Serialize
        data = [WorkModeResponse.model_validate(w).model_dump() for w in work_modes]
        
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content=success_response("Work modes fetched successfully", data)
        )
    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=error_response(f"Failed to fetch work modes: {str(e)}")
        )

@router.post("", response_model=WorkModeResponse)
def create_work_mode(payload: WorkModeCreate, db: Session = Depends(get_db)):
    """
    Create a new work mode.
    """
    try:
        # Check if already exists (case-insensitive)
        existing = db.query(WorkMode).filter(WorkMode.name.ilike(payload.name.strip())).first()
        if existing:
            return JSONResponse(
                status_code=status.HTTP_400_BAD_REQUEST,
                content=error_response("Work mode with this name already exists")
            )
            
        new_wm = WorkMode(
            name=payload.name.strip(),
            is_active=True
        )
        db.add(new_wm)
        db.commit()
        db.refresh(new_wm)
        
        data = WorkModeResponse.model_validate(new_wm).model_dump()
        return JSONResponse(
            status_code=status.HTTP_201_CREATED,
            content=success_response("Work mode created successfully", data)
        )
    except SQLAlchemyError as e:
        db.rollback()
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=error_response(f"Database error: {str(e)}")
        )
    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=error_response(f"Server error: {str(e)}")
        )

@router.put("/{wm_id}", response_model=WorkModeResponse)
def update_work_mode(wm_id: int, payload: WorkModeUpdate, db: Session = Depends(get_db)):
    """
    Update work mode name or active status.
    """
    try:
        wm = db.query(WorkMode).filter(WorkMode.id == wm_id).first()
        if not wm:
            return JSONResponse(
                status_code=status.HTTP_404_NOT_FOUND,
                content=error_response("Work mode not found")
            )
            
        if payload.name is not None:
            name_stripped = payload.name.strip()
            # Check unique if renaming
            if name_stripped.lower() != wm.name.lower():
                existing = db.query(WorkMode).filter(WorkMode.name.ilike(name_stripped)).first()
                if existing:
                    return JSONResponse(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        content=error_response("Work mode with this name already exists")
                    )
                
                # Cascade rename to all associated models!
                old_name = wm.name
                db.query(JobRequirement).filter(JobRequirement.work_mode == old_name).update({JobRequirement.work_mode: name_stripped})
                db.query(Employee).filter(Employee.work_mode == old_name).update({Employee.work_mode: name_stripped})
                db.query(Attendance).filter(Attendance.work_mode == old_name).update({Attendance.work_mode: name_stripped})
                
            wm.name = name_stripped
            
        if payload.is_active is not None:
            wm.is_active = payload.is_active
            
        db.commit()
        db.refresh(wm)
        
        data = WorkModeResponse.model_validate(wm).model_dump()
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content=success_response("Work mode updated successfully", data)
        )
    except SQLAlchemyError as e:
        db.rollback()
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=error_response(f"Database error: {str(e)}")
        )
    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=error_response(f"Server error: {str(e)}")
        )
