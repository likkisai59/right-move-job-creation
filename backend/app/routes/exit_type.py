from fastapi import APIRouter, Depends, status, HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from typing import List, Optional

from app.core.database import get_db
from app.models.exit_type import ExitType
from app.schemas.exit_type import ExitTypeCreate, ExitTypeUpdate, ExitTypeResponse
from app.utils.response import success_response, error_response

router = APIRouter(prefix="/api/exit-types", tags=["Exit Types"])

@router.get("", response_model=List[ExitTypeResponse])
def get_exit_types(
    active_only: Optional[bool] = None, 
    sort_by: Optional[str] = None, 
    sort_order: Optional[str] = "asc", 
    db: Session = Depends(get_db)
):
    """
    Get all exit types.
    Optionally filter by active status.
    """
    try:
        query = db.query(ExitType)
        if active_only is not None:
            query = query.filter(ExitType.is_active == active_only)
        
        from app.utils.sorting import apply_sorting
        exit_types = apply_sorting(query, ExitType, sort_by, sort_order, ExitType.name).all()
        
        # Serialize
        data = [ExitTypeResponse.model_validate(d).model_dump() for d in exit_types]
        
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content=success_response("Exit types fetched successfully", data)
        )
    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=error_response(f"Failed to fetch exit types: {str(e)}")
        )

@router.post("", response_model=ExitTypeResponse)
def create_exit_type(payload: ExitTypeCreate, db: Session = Depends(get_db)):
    """
    Create a new exit type.
    """
    try:
        # Check if already exists (case-insensitive)
        existing = db.query(ExitType).filter(ExitType.name.ilike(payload.name.strip())).first()
        if existing:
            return JSONResponse(
                status_code=status.HTTP_400_BAD_REQUEST,
                content=error_response("Exit type with this name already exists")
            )
            
        new_exit_type = ExitType(
            name=payload.name.strip(),
            is_active=True
        )
        db.add(new_exit_type)
        db.commit()
        db.refresh(new_exit_type)
        
        data = ExitTypeResponse.model_validate(new_exit_type).model_dump()
        return JSONResponse(
            status_code=status.HTTP_201_CREATED,
            content=success_response("Exit type created successfully", data)
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

@router.put("/{exit_type_id}", response_model=ExitTypeResponse)
def update_exit_type(exit_type_id: int, payload: ExitTypeUpdate, db: Session = Depends(get_db)):
    """
    Update exit type name or active status.
    """
    try:
        exit_type = db.query(ExitType).filter(ExitType.id == exit_type_id).first()
        if not exit_type:
            return JSONResponse(
                status_code=status.HTTP_404_NOT_FOUND,
                content=error_response("Exit type not found")
            )
            
        if payload.name is not None:
            name_stripped = payload.name.strip()
            # Check unique if renaming
            if name_stripped.lower() != exit_type.name.lower():
                existing = db.query(ExitType).filter(ExitType.name.ilike(name_stripped)).first()
                if existing:
                    return JSONResponse(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        content=error_response("Exit type with this name already exists")
                    )
                
            exit_type.name = name_stripped
            
        if payload.is_active is not None:
            exit_type.is_active = payload.is_active
            
        db.commit()
        db.refresh(exit_type)
        
        data = ExitTypeResponse.model_validate(exit_type).model_dump()
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content=success_response("Exit type updated successfully", data)
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
