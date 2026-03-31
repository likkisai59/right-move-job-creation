from fastapi import APIRouter, Depends, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import Optional

from app.core.database import get_db
from app.models.organization import Organization
from app.schemas.organization import OrganizationCreate, OrganizationResponse
from app.utils.response import success_response, error_response

router = APIRouter(prefix="/api/organizations", tags=["Organizations"])

@router.post("", status_code=status.HTTP_201_CREATED)
def add_organization(payload: OrganizationCreate, db: Session = Depends(get_db)):
    try:
        new_org = Organization(**payload.model_dump())
        db.add(new_org)
        db.commit()
        db.refresh(new_org)
        data = OrganizationResponse.model_validate(new_org).model_dump(mode="json")
        return JSONResponse(status_code=201, content=success_response("Organization Created", data))
    except IntegrityError:
        db.rollback()
        return JSONResponse(status_code=400, content=error_response("Organization already exists"))
    except Exception as exc:
        db.rollback()
        return JSONResponse(status_code=500, content=error_response(str(exc)))

@router.get("", status_code=status.HTTP_200_OK)
def list_organizations(status: Optional[str] = "ACTIVE", db: Session = Depends(get_db)):
    try:
        query = db.query(Organization)
        if status:
            query = query.filter(Organization.status == status.upper())
        orgs = query.order_by(Organization.name.asc()).all()
        data = [OrganizationResponse.model_validate(o).model_dump(mode="json") for o in orgs]
        return JSONResponse(status_code=200, content=success_response("Fetched Organizations", data))
    except Exception as exc:
        return JSONResponse(status_code=500, content=error_response(str(exc)))
