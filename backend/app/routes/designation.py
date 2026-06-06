from fastapi import APIRouter, Depends, status, HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from typing import List, Optional

from app.core.database import get_db
from app.models.designation import Designation
from app.models.employee import Employee
from app.schemas.designation import DesignationCreate, DesignationUpdate, DesignationResponse
from app.utils.response import success_response, error_response

router = APIRouter(prefix="/api/designations", tags=["Designations"])

@router.get("", response_model=List[DesignationResponse])
def get_designations(
    active_only: Optional[bool] = None, 
    sort_by: Optional[str] = None, 
    sort_order: Optional[str] = "asc", 
    db: Session = Depends(get_db)
):
    """
    Get all designations.
    Optionally filter by active status.
    """
    try:
        query = db.query(Designation)
        if active_only is not None:
            query = query.filter(Designation.is_active == active_only)
        
        from app.utils.sorting import apply_sorting
        designations = apply_sorting(query, Designation, sort_by, sort_order, Designation.name).all()
        
        # Serialize
        data = [DesignationResponse.model_validate(d).model_dump() for d in designations]
        
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content=success_response("Designations fetched successfully", data)
        )
    except Exception as e:
        # Fallback if the database has not been altered yet
        if "Unknown column" in str(e) and ("leaves" in str(e) or "holidays" in str(e)):
            from sqlalchemy import text
            sql = "SELECT id, name, is_active FROM designations"
            if active_only is not None:
                sql += f" WHERE is_active = {1 if active_only else 0}"
            sql += f" ORDER BY name {'ASC' if sort_order == 'asc' else 'DESC'}"
            
            try:
                result = db.execute(text(sql))
                data = []
                for row in result:
                    data.append({
                        "id": row[0],
                        "name": row[1],
                        "is_active": bool(row[2]),
                        "leaves": 30,
                        "holidays": []
                    })
                return JSONResponse(
                    status_code=status.HTTP_200_OK,
                    content=success_response("Designations fetched successfully (fallback)", data)
                )
            except Exception as fallback_err:
                return JSONResponse(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    content=error_response(f"Failed to fetch designations (fallback): {str(fallback_err)}")
                )
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=error_response(f"Failed to fetch designations: {str(e)}")
        )

@router.post("", response_model=DesignationResponse)
def create_designation(payload: DesignationCreate, db: Session = Depends(get_db)):
    """
    Create a new designation.
    """
    try:
        # Check if already exists (case-insensitive)
        existing = db.query(Designation).filter(Designation.name.ilike(payload.name.strip())).first()
        if existing:
            return JSONResponse(
                status_code=status.HTTP_400_BAD_REQUEST,
                content=error_response("Designation with this name already exists")
            )
            
        new_designation = Designation(
            name=payload.name.strip(),
            is_active=True
        )
        db.add(new_designation)
        db.commit()
        db.refresh(new_designation)
        
        data = DesignationResponse.model_validate(new_designation).model_dump()
        return JSONResponse(
            status_code=status.HTTP_201_CREATED,
            content=success_response("Designation created successfully", data)
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

@router.put("/{designation_id}", response_model=DesignationResponse)
def update_designation(designation_id: int, payload: DesignationUpdate, db: Session = Depends(get_db)):
    """
    Update designation name or active status.
    """
    try:
        designation = db.query(Designation).filter(Designation.id == designation_id).first()
        if not designation:
            return JSONResponse(
                status_code=status.HTTP_404_NOT_FOUND,
                content=error_response("Designation not found")
            )
            
        if payload.name is not None:
            name_stripped = payload.name.strip()
            # Check unique if renaming
            if name_stripped.lower() != designation.name.lower():
                existing = db.query(Designation).filter(Designation.name.ilike(name_stripped)).first()
                if existing:
                    return JSONResponse(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        content=error_response("Designation with this name already exists")
                    )
                
                # Cascade rename to all existing employees assigned to this designation!
                old_name = designation.name
                db.query(Employee).filter(Employee.designation == old_name).update({Employee.designation: name_stripped})
                
            designation.name = name_stripped
            
        if payload.is_active is not None:
            designation.is_active = payload.is_active
            
        db.commit()
        db.refresh(designation)
        
        data = DesignationResponse.model_validate(designation).model_dump()
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content=success_response("Designation updated successfully", data)
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
