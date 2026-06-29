from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.schemas.account import AccountCreate, AccountResponse, AccountUpdate, AccountListResponse, PlacementResponse
from app.schemas.payroll_config import PayrollConfigResponse, PayrollConfigUpdate
from app.schemas.invoice import InvoiceResponse, InvoiceUpdate
from app.services import accounts_service

router = APIRouter(prefix="/api/accounts", tags=["Accounts"])

@router.get("/", response_model=List[AccountListResponse])
def list_accounts(db: Session = Depends(get_db)):
    return accounts_service.list_accounts(db)

@router.post("/", response_model=AccountResponse)
def create_account(payload: AccountCreate, db: Session = Depends(get_db)):
    try:
        return accounts_service.create_account(db, payload)
    except ValueError as exc:
        msg = str(exc)
        if "not found" in msg:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=msg)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=msg)

@router.get("/employee/{employee_id}", response_model=AccountResponse)
def get_account_by_employee(employee_id: int, db: Session = Depends(get_db)):
    account = accounts_service.get_account_by_employee(db, employee_id)
    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Account details not found for this employee"
        )
    return account

@router.put("/employee/{employee_id}", response_model=AccountResponse)
def update_account(employee_id: int, payload: AccountUpdate, db: Session = Depends(get_db)):
    try:
        return accounts_service.update_account(db, employee_id, payload)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))

# ── PAYROLL CONFIGURATION ENDPOINTS ───────────────────────────

@router.get("/config", response_model=PayrollConfigResponse)
def get_payroll_config(db: Session = Depends(get_db)):
    return accounts_service.get_payroll_config(db)

@router.put("/config", response_model=PayrollConfigResponse)
def update_payroll_config(payload: PayrollConfigUpdate, db: Session = Depends(get_db)):
    return accounts_service.update_payroll_config(
        db, 
        pf_percentage=payload.pf_percentage, 
        tds_percentage=payload.tds_percentage
    )

# ── PLACEMENTS ENDPOINTS ──────────────────────────────────────

@router.get("/placements", response_model=List[PlacementResponse])
def list_placements(db: Session = Depends(get_db)):
    return accounts_service.list_placements(db)

# ── INVOICING & BILLING ENDPOINTS ────────────────────────────

@router.get("/invoices", response_model=List[InvoiceResponse])
def list_invoices(db: Session = Depends(get_db)):
    return accounts_service.list_invoices(db)

@router.put("/invoices/{mapping_id}", response_model=InvoiceResponse)
def update_invoice(mapping_id: int, payload: InvoiceUpdate, db: Session = Depends(get_db)):
    accounts_service.update_invoice(db, mapping_id, payload)
    updated = accounts_service.get_invoice_by_mapping_id(db, mapping_id)
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invoice not found after update"
        )
    return updated
