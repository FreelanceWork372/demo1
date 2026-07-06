from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.merchant import Merchant
from app.schemas.merchant_schema import (
    MerchantCreate,
    MerchantUpdate,
    MerchantResponse,
)
from app.core.dependencies import require_role, get_current_user


router = APIRouter(prefix="/merchants", tags=["Merchants"])


@router.get("/", response_model=list[MerchantResponse])
def get_merchants(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin"))
):
    return db.query(Merchant).order_by(Merchant.id.asc()).all()


@router.post("/", response_model=MerchantResponse)
def create_merchant(
    payload: MerchantCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin"))
):
    user = db.query(User).filter(User.id == payload.user_id).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    if user.role.value != "merchant":
        raise HTTPException(
            status_code=400,
            detail="Selected user is not a merchant user"
        )

    existing_profile = db.query(Merchant).filter(
        Merchant.user_id == payload.user_id
    ).first()

    if existing_profile:
        raise HTTPException(
            status_code=400,
            detail="Merchant profile already exists for this user"
        )

    merchant = Merchant(
        user_id=payload.user_id,
        business_name=payload.business_name,
        contact_person=payload.contact_person,
        pickup_address=payload.pickup_address
    )

    db.add(merchant)
    db.commit()
    db.refresh(merchant)

    return merchant


@router.get("/me", response_model=MerchantResponse)
def get_my_merchant_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("merchant"))
):
    merchant = db.query(Merchant).filter(
        Merchant.user_id == current_user.id
    ).first()

    if not merchant:
        raise HTTPException(
            status_code=404,
            detail="Merchant profile not found"
        )

    return merchant


@router.get("/{merchant_id}", response_model=MerchantResponse)
def get_merchant(
    merchant_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin"))
):
    merchant = db.query(Merchant).filter(Merchant.id == merchant_id).first()

    if not merchant:
        raise HTTPException(
            status_code=404,
            detail="Merchant not found"
        )

    return merchant


@router.put("/{merchant_id}", response_model=MerchantResponse)
def update_merchant(
    merchant_id: int,
    payload: MerchantUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin"))
):
    merchant = db.query(Merchant).filter(Merchant.id == merchant_id).first()

    if not merchant:
        raise HTTPException(
            status_code=404,
            detail="Merchant not found"
        )

    if payload.business_name is not None:
        merchant.business_name = payload.business_name

    if payload.contact_person is not None:
        merchant.contact_person = payload.contact_person

    if payload.pickup_address is not None:
        merchant.pickup_address = payload.pickup_address

    db.commit()
    db.refresh(merchant)

    return merchant