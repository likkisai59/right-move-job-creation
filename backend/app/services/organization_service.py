from sqlalchemy.orm import Session
from app.models.organization import Organization
from app.schemas.organization import OrganizationCreate
from typing import List, Optional


def create_organization(db: Session, payload: OrganizationCreate) -> Organization:
    new_org = Organization(**payload.model_dump())
    db.add(new_org)
    db.commit()
    db.refresh(new_org)
    return new_org


def get_all_organizations(db: Session, status: Optional[str] = "ACTIVE") -> List[Organization]:
    query = db.query(Organization)
    if status:
        query = query.filter(Organization.status == status.upper())
    return query.order_by(Organization.name.asc()).all()


def get_organization_by_id(db: Session, org_id: int) -> Optional[Organization]:
    return db.query(Organization).filter(Organization.id == org_id).first()
