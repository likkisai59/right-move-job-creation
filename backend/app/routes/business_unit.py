from fastapi import APIRouter, Depends, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from typing import List, Optional

from app.core.database import get_db
from app.models.business_unit import BusinessUnit
from app.models.job_requirement import Job
from app.models.candidate import Candidate
from app.models.employee import Employee
from app.schemas.business_unit import BusinessUnitCreate, BusinessUnitUpdate, BusinessUnitResponse
from app.utils.response import success_response, error_response

router = APIRouter(prefix="/api/business-units", tags=["Business Units"])

@router.get("", response_model=List[BusinessUnitResponse])
def get_business_units(active_only: Optional[bool] = None, db: Session = Depends(get_db)):
    """
    Get all business units.
    Optionally filter by active status.
    """
    try:
        query = db.query(BusinessUnit)
        if active_only is not None:
            query = query.filter(BusinessUnit.is_active == active_only)
        
        business_units = query.order_by(BusinessUnit.name.asc()).all()
        
        # Serialize
        data = [BusinessUnitResponse.model_validate(b).model_dump() for b in business_units]
        
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content=success_response("Business units fetched successfully", data)
        )
    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=error_response(f"Failed to fetch business units: {str(e)}")
        )

@router.post("", response_model=BusinessUnitResponse)
def create_business_unit(payload: BusinessUnitCreate, db: Session = Depends(get_db)):
    """
    Create a new business unit.
    """
    try:
        # Check if already exists (case-insensitive)
        existing = db.query(BusinessUnit).filter(BusinessUnit.name.ilike(payload.name.strip())).first()
        if existing:
            return JSONResponse(
                status_code=status.HTTP_400_BAD_REQUEST,
                content=error_response("Business unit with this name already exists")
            )
            
        new_bu = BusinessUnit(
            name=payload.name.strip(),
            is_active=True
        )
        db.add(new_bu)
        db.commit()
        db.refresh(new_bu)
        
        data = BusinessUnitResponse.model_validate(new_bu).model_dump()
        return JSONResponse(
            status_code=status.HTTP_201_CREATED,
            content=success_response("Business unit created successfully", data)
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

@router.put("/{bu_id}", response_model=BusinessUnitResponse)
def update_business_unit(bu_id: int, payload: BusinessUnitUpdate, db: Session = Depends(get_db)):
    """
    Update business unit name or active status.
    """
    try:
        bu = db.query(BusinessUnit).filter(BusinessUnit.id == bu_id).first()
        if not bu:
            return JSONResponse(
                status_code=status.HTTP_404_NOT_FOUND,
                content=error_response("Business unit not found")
            )
            
        if payload.name is not None:
            name_stripped = payload.name.strip()
            # Check unique if renaming
            if name_stripped.lower() != bu.name.lower():
                existing = db.query(BusinessUnit).filter(BusinessUnit.name.ilike(name_stripped)).first()
                if existing:
                    return JSONResponse(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        content=error_response("Business unit with this name already exists")
                    )
                
                # Cascade rename to all associated models!
                old_name = bu.name
                db.query(Job).filter(Job.business_unit == old_name).update({Job.business_unit: name_stripped})
                db.query(Candidate).filter(Candidate.business_unit == old_name).update({Candidate.business_unit: name_stripped})
                db.query(Employee).filter(Employee.assigned_business_unit == old_name).update({Employee.assigned_business_unit: name_stripped})
                
            bu.name = name_stripped
            
        if payload.is_active is not None:
            bu.is_active = payload.is_active
            
        db.commit()
        db.refresh(bu)
        
        data = BusinessUnitResponse.model_validate(bu).model_dump()
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content=success_response("Business unit updated successfully", data)
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
