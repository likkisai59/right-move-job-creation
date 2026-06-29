from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.schemas.account import AccountCreate, AccountResponse, AccountUpdate, AccountListResponse
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
