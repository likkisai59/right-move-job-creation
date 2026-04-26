from fastapi import APIRouter, Depends, status, Query
from fastapi.responses import JSONResponse, StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import Optional, List
from pydantic import ValidationError
from datetime import datetime

from app.core.database import get_db
from app.schemas.organization import OrganizationCreate, OrganizationUpdate, OrganizationResponse
from app.services.organization_service import (
    create_organization,
    get_all_organizations,
    get_organization_by_id,
    update_organization,
    delete_organization,
    check_organization_exists,
    export_organizations_to_excel
)
from app.utils.response import success_response, error_response

router = APIRouter(prefix="/api/organizations", tags=["Organizations"])

@router.post("", status_code=status.HTTP_201_CREATED)
def add_organization(payload: OrganizationCreate, db: Session = Depends(get_db)):
    try:
        new_org = create_organization(db, payload)
        data = OrganizationResponse.model_validate(new_org).model_dump(mode="json")
        return JSONResponse(status_code=201, content=success_response("Organization created successfully", data))
    except IntegrityError:
        db.rollback()
        return JSONResponse(status_code=status.HTTP_400_BAD_REQUEST, content=error_response("Organization with this name or ID already exists"))
    except ValidationError as exc:
        error_msg = exc.errors()[0]['msg'].replace('Value error, ', '')
        return JSONResponse(status_code=status.HTTP_400_BAD_REQUEST, content=error_response(error_msg))
    except ValueError as exc:
        return JSONResponse(status_code=status.HTTP_400_BAD_REQUEST, content=error_response(str(exc)))
    except Exception as exc:
        db.rollback()
        return JSONResponse(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, content=error_response(str(exc)))

@router.get("", status_code=status.HTTP_200_OK)
def list_organizations(
    status: Optional[str] = Query(None), 
    search: Optional[str] = Query(None),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    try:
        orgs = get_all_organizations(db, status, search, start_date, end_date)
        data = [OrganizationResponse.model_validate(o).model_dump(mode="json") for o in orgs]
        return JSONResponse(
            status_code=200,
            content=success_response("Organizations fetched successfully", data)
        )
    except Exception as exc:
        return JSONResponse(status_code=500, content=error_response(str(exc)))

@router.get("/export", status_code=status.HTTP_200_OK)
def export_organizations(
    status: Optional[str] = Query(None), 
    search: Optional[str] = Query(None),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    try:
        orgs = get_all_organizations(db, status, search, start_date, end_date)
        output = export_organizations_to_excel(orgs)
        
        filename = f"organizations_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
        
        return StreamingResponse(
            output,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    except Exception as exc:
        return JSONResponse(status_code=500, content=error_response(str(exc)))

@router.get("/check-duplicate", status_code=status.HTTP_200_OK)
def check_duplicate(name: str = Query(...), db: Session = Depends(get_db)):
    try:
        exists = check_organization_exists(db, name)
        return JSONResponse(status_code=200, content=success_response("Duplicate check completed", {"exists": exists}))
    except Exception as exc:
        return JSONResponse(status_code=500, content=error_response(str(exc)))

@router.get("/{org_id}", status_code=status.HTTP_200_OK)
def get_organization(org_id: int, db: Session = Depends(get_db)):
    try:
        org = get_organization_by_id(db, org_id)
        if not org:
            return JSONResponse(status_code=404, content=error_response("Organization not found"))
        data = OrganizationResponse.model_validate(org).model_dump(mode="json")
        return JSONResponse(status_code=200, content=success_response("Organization fetched successfully", data))
    except Exception as exc:
        return JSONResponse(status_code=500, content=error_response(str(exc)))

@router.put("/{org_id}", status_code=status.HTTP_200_OK)
def edit_organization(org_id: int, payload: OrganizationUpdate, db: Session = Depends(get_db)):
    try:
        updated_org = update_organization(db, org_id, payload)
        if not updated_org:
            return JSONResponse(status_code=404, content=error_response("Organization not found"))
        data = OrganizationResponse.model_validate(updated_org).model_dump(mode="json")
        return JSONResponse(status_code=200, content=success_response("Organization updated successfully", data))
    except ValidationError as exc:
        error_msg = exc.errors()[0]['msg'].replace('Value error, ', '')
        return JSONResponse(status_code=400, content=error_response(error_msg))
    except ValueError as exc:
        return JSONResponse(status_code=400, content=error_response(str(exc)))
    except Exception as exc:
        db.rollback()
        return JSONResponse(status_code=500, content=error_response(str(exc)))

@router.delete("/{org_id}", status_code=status.HTTP_200_OK)
def remove_organization(org_id: int, db: Session = Depends(get_db)):
    try:
        success = delete_organization(db, org_id)
        if not success:
            return JSONResponse(status_code=404, content=error_response("Organization not found"))
        return JSONResponse(status_code=200, content=success_response("Organization deleted successfully"))
    except Exception as exc:
        db.rollback()
        return JSONResponse(status_code=500, content=error_response(str(exc)))
