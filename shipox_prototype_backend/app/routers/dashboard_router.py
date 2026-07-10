from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models.user import User
from app.models.merchant import Merchant
from app.models.driver import Driver
from app.models.order import Order, OrderStatus
from app.core.dependencies import require_role


router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


def count_orders_by_status(db: Session, base_query):
    counts = {
        "total": base_query.count(),
        "created": base_query.filter(Order.current_status == OrderStatus.created).count(),
        "assigned": base_query.filter(Order.current_status == OrderStatus.assigned).count(),
        "picked_up": base_query.filter(Order.current_status == OrderStatus.picked_up).count(),
        "in_transit": base_query.filter(Order.current_status == OrderStatus.in_transit).count(),
        "delivered": base_query.filter(Order.current_status == OrderStatus.delivered).count(),
        "failed": base_query.filter(Order.current_status == OrderStatus.failed).count(),
        "cancelled": base_query.filter(Order.current_status == OrderStatus.cancelled).count(),
        "returned": base_query.filter(Order.current_status == OrderStatus.returned).count(),
    }

    return counts


@router.get("/admin")
def admin_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin"))
):
    base_query = db.query(Order)

    order_counts = count_orders_by_status(db, base_query)

    active_merchants = (
        db.query(Merchant)
        .join(User, Merchant.user_id == User.id)
        .filter(User.is_active == True)
        .count()
    )

    active_drivers = (
        db.query(Driver)
        .join(User, Driver.user_id == User.id)
        .filter(User.is_active == True)
        .count()
    )

    available_drivers = db.query(Driver).filter(
        Driver.availability_status == "available"
    ).count()

    return {
        **order_counts,
        "active_merchants": active_merchants,
        "active_drivers": active_drivers,
        "available_drivers": available_drivers,
    }


@router.get("/merchant")
def merchant_dashboard(
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

    base_query = db.query(Order).filter(Order.merchant_id == merchant.id)

    return count_orders_by_status(db, base_query)


@router.get("/driver")
def driver_dashboard(
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

    base_query = db.query(Order).filter(Order.assigned_driver_id == driver.id)

    return {
        **count_orders_by_status(db, base_query),
        "availability_status": driver.availability_status.value,
    }