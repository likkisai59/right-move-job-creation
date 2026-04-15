from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.organization import Organization
from app.schemas.organization import OrganizationCreate, OrganizationUpdate
from typing import List, Optional


def generate_organization_id(db: Session) -> str:
    max_id = db.query(func.max(Organization.id)).scalar() or 0
    return f"ORG{max_id + 1:03d}"


ALLOWED_ORGANIZATIONS = {
    "FNZ", "Tvarit", "Amplicomm", "DesignTech Systems", "Kushals", "Wipro IT", "Gallaghar", "Eclerx", "Clean Harbour", "Ziff Davis",
    "Mphasis", "Concentrix", "Harbinger", "Mphasis IT", "Mphasis BPS", "Mphasis Lateral", "Mphasis Finance", "KnovaOne", "Tech Mahindra", "All State",
    "Truconnect", "TCS IT", "TCS BPS", "TCS Finance", "TCS Lateral", "EXL", "Cognizant Lateral", "Cognizant Finance", "Cognizant BPS", "Cognizant IT",
    "One Card", "Sutherland", "Early Salary(Fibe)", "Jade Business Services", "InchCape Shipping Services", "Gallagher", "Softdel", "Druva", "UPL", "Wipro Technologies",
    "AffinityX", "Metamothposys", "Opus", "Facile", "Coforge", "24*7.AI", "Tata Motors", "11:11 Systems", "EY", "Persistent",
    "CC Tech", "Wipro Finance", "Medline", "Hexaware", "TML", "Stuba", "Aditya Birla", "Rio tinto", "Nextdigm", "Wipro Lateral",
    "Wipro BPS", "WNS", "Infosys", "TCS", "Creospan", "Sincro Digital", "Full Potential", "Gentrack", "MediaOcean", "Lenze",
    "Capita", "SecurityHQ", "Radicle Minds", "NexDigm", "Cognizant", "DNEG", "OrangePet", "MSYS Technologies", "Ocwen", "Altisource",
    "NumeratorOne", "AFour Technologies", "Infovision Labs", "RealThingks", "Vodafone", "Allstate", "BNY", "Springer Nature", "11:11 Systems(Sungard)", "Global logic",
    "IVL", "T Systems", "Airtel", "Geeks", "Synechron", "Rapid Circle", "Sears Holding", "ID Medical", "TurboHire"
}

def create_organization(db: Session, payload: OrganizationCreate) -> Organization:
    # Strict validation: Only allow names in the restricted list
    if payload.organization_name not in ALLOWED_ORGANIZATIONS:
         raise ValueError(f"Organization '{payload.organization_name}' is not in the allowed list.")
         
    org_id = generate_organization_id(db)
    new_org = Organization(**payload.model_dump(), organization_id=org_id)
    db.add(new_org)
    db.commit()
    db.refresh(new_org)
    return new_org


def get_all_organizations(db: Session, status: Optional[str] = None, search: Optional[str] = None) -> List[Organization]:
    # Part 5: Filter by is_active = 1
    query = db.query(Organization).filter(Organization.is_active == 1)
    if status:
        query = query.filter(Organization.status == status.lower())
    if search:
        search_term = f"%{search.strip().lower()}%"
        query = query.filter(func.lower(Organization.organization_name).like(search_term))
    return query.order_by(Organization.organization_name.asc()).all()


def get_organization_by_id(db: Session, org_id: int) -> Optional[Organization]:
    return db.query(Organization).filter(Organization.id == org_id).first()


def update_organization(db: Session, org_id: int, payload: OrganizationUpdate) -> Optional[Organization]:
    db_org = get_organization_by_id(db, org_id)
    if not db_org:
        return None
    
    update_data = payload.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_org, key, value)
    
    db.commit()
    db.refresh(db_org)
    return db_org


def delete_organization(db: Session, org_id: int) -> bool:
    db_org = get_organization_by_id(db, org_id)
    if not db_org:
        return False
    db.delete(db_org)
    db.commit()
    return True


def check_organization_exists(db: Session, name: str) -> bool:
    """Checks if organization exists with case-insensitive name."""
    clean_name = name.strip().lower()
    print(f"DEBUG: Checking organization duplicate: '{clean_name}'")
    
    exists = db.query(Organization).filter(
        func.lower(func.trim(Organization.organization_name)) == clean_name
    ).first()
    
    print(f"DEBUG: Duplicate check result: {'EXISTS' if exists else 'NOT FOUND'}")
    return exists is not None
