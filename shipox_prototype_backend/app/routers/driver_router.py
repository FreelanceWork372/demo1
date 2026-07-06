from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.driver import Driver, DriverAvailability
from app.schemas.driver_schema import (
    DriverCreate,
    DriverUpdate,
    DriverResponse,
)
from app.core.dependencies import require_role


router = APIRouter(prefix="/drivers", tags=["Drivers"])


@router.get("/", response_model=list[DriverResponse])
def get_drivers(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin"))
):
    return db.query(Driver).order_by(Driver.id.asc()).all()


@router.post("/", response_model=DriverResponse)
def create_driver(
    payload: DriverCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin"))
):
    user = db.query(User).filter(User.id == payload.user_id).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    if user.role.value != "driver":
        raise HTTPException(
            status_code=400,
            detail="Selected user is not a driver user"
        )

    existing_profile = db.query(Driver).filter(
        Driver.user_id == payload.user_id
    ).first()

    if existing_profile:
        raise HTTPException(
            status_code=400,
            detail="Driver profile already exists for this user"
        )

    if payload.availability_status not in ["available", "busy", "inactive"]:
        raise HTTPException(
            status_code=400,
            detail="Invalid availability status"
        )

    driver = Driver(
        user_id=payload.user_id,
        availability_status=DriverAvailability(payload.availability_status)
    )

    db.add(driver)
    db.commit()
    db.refresh(driver)

    return driver


@router.get("/me", response_model=DriverResponse)
def get_my_driver_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("driver"))
):
    driver = db.query(Driver).filter(
        Driver.user_id == current_user.id
    ).first()

    if not driver:
        raise HTTPException(
            status_code=404,
            detail="Driver profile not found"
        )

    return driver


@router.get("/{driver_id}", response_model=DriverResponse)
def get_driver(
    driver_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin"))
):
    driver = db.query(Driver).filter(Driver.id == driver_id).first()

    if not driver:
        raise HTTPException(
            status_code=404,
            detail="Driver not found"
        )

    return driver


@router.put("/{driver_id}", response_model=DriverResponse)
def update_driver(
    driver_id: int,
    payload: DriverUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "driver"))
):
    driver = db.query(Driver).filter(Driver.id == driver_id).first()

    if not driver:
        raise HTTPException(
            status_code=404,
            detail="Driver not found"
        )

    if current_user.role.value == "driver" and driver.user_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="You can only update your own driver profile"
        )

    if payload.availability_status is not None:
        if payload.availability_status not in ["available", "busy", "inactive"]:
            raise HTTPException(
                status_code=400,
                detail="Invalid availability status"
            )

        driver.availability_status = DriverAvailability(payload.availability_status)

    db.commit()
    db.refresh(driver)

    return driver