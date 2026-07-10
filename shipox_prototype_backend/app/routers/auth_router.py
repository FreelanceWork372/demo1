from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.schemas.auth_schema import LoginRequest, LoginResponse, RegisterRequest
from app.core.security import verify_password, create_access_token, hash_password
from app.core.dependencies import get_current_user
from app.models.user import UserRole
from app.models.merchant import Merchant
from app.models.driver import Driver, DriverAvailability

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=LoginResponse)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    if payload.role not in ["merchant", "driver"]:
        raise HTTPException(status_code=400, detail="Can only register as merchant or driver")

    existing_user = db.query(User).filter(User.email == payload.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        name=payload.name,
        email=payload.email,
        password_hash=hash_password(payload.password),
        phone=payload.phone,
        role=UserRole(payload.role),
        is_active=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    if payload.role == "merchant":
        if not payload.business_name or not payload.contact_person or not payload.pickup_address:
            raise HTTPException(status_code=400, detail="Merchant details are required")
        merchant_profile = Merchant(
            user_id=user.id,
            business_name=payload.business_name,
            contact_person=payload.contact_person,
            pickup_address=payload.pickup_address
        )
        db.add(merchant_profile)
    elif payload.role == "driver":
        driver_profile = Driver(
            user_id=user.id,
            availability_status=DriverAvailability.available
        )
        db.add(driver_profile)
    
    db.commit()

    token = create_access_token(data={"sub": str(user.id), "role": user.role.value})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role.value
        }
    }


@router.post("/login", response_model=LoginResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    if not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )

    token = create_access_token(
        data={
            "sub": str(user.id),
            "role": user.role.value
        }
    )

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role.value
        }
    }


@router.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "phone": current_user.phone,
        "role": current_user.role.value,
        "is_active": current_user.is_active
    }