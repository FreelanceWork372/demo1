from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import uuid4

from app.database import get_db
from app.models.user import User
from app.models.merchant import Merchant
from app.models.driver import Driver
from app.models.order import Order, OrderStatus
from app.models.order_status_history import OrderStatusHistory
from app.schemas.order_schema import (
    OrderCreate,
    OrderUpdate,
    AssignDriverRequest,
    StatusUpdateRequest,
    OrderResponse,
    OrderTimelineResponse,
)
from app.core.dependencies import require_role


router = APIRouter(prefix="/orders", tags=["Orders"])


def generate_order_number() -> str:
    return "SHPX-" + uuid4().hex[:8].upper()


def create_timeline_entry(
    db: Session,
    order_id: int,
    status: OrderStatus,
    updated_by_user_id: int,
    notes: str | None = None
):
    timeline = OrderStatusHistory(
        order_id=order_id,
        status=status,
        updated_by_user_id=updated_by_user_id,
        notes=notes
    )

    db.add(timeline)


def get_allowed_next_statuses(current_status: str):
    rules = {
        "created": ["assigned", "cancelled"],
        "assigned": ["picked_up", "cancelled"],
        "picked_up": ["in_transit", "failed"],
        "in_transit": ["delivered", "failed", "returned"],
        "failed": ["returned"],
        "delivered": [],
        "cancelled": [],
        "returned": [],
    }

    return rules.get(current_status, [])


@router.post("/", response_model=OrderResponse)
def create_order(
    payload: OrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("merchant", "admin"))
):
    if current_user.role.value == "merchant":
        merchant = db.query(Merchant).filter(
            Merchant.user_id == current_user.id
        ).first()

        if not merchant:
            raise HTTPException(
                status_code=404,
                detail="Merchant profile not found"
            )

    else:
        raise HTTPException(
            status_code=400,
            detail="Admin order creation is not enabled in Phase 1. Use merchant login."
        )

    order = Order(
        order_number=generate_order_number(),
        merchant_id=merchant.id,
        customer_name=payload.customer_name,
        customer_phone=payload.customer_phone,
        pickup_address=payload.pickup_address,
        delivery_address=payload.delivery_address,
        package_description=payload.package_description,
        delivery_charge=payload.delivery_charge,
        cod_amount=payload.cod_amount,
        current_status=OrderStatus.created
    )

    db.add(order)
    db.commit()
    db.refresh(order)

    create_timeline_entry(
        db=db,
        order_id=order.id,
        status=OrderStatus.created,
        updated_by_user_id=current_user.id,
        notes="Order created by merchant"
    )

    db.commit()
    db.refresh(order)

    return order


@router.get("/", response_model=list[OrderResponse])
def get_orders(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "merchant", "driver"))
):
    if current_user.role.value == "admin":
        return db.query(Order).order_by(Order.id.asc()).all()

    if current_user.role.value == "merchant":
        merchant = db.query(Merchant).filter(
            Merchant.user_id == current_user.id
        ).first()

        if not merchant:
            raise HTTPException(
                status_code=404,
                detail="Merchant profile not found"
            )

        return db.query(Order).filter(
            Order.merchant_id == merchant.id
        ).order_by(Order.id.asc()).all()

    if current_user.role.value == "driver":
        driver = db.query(Driver).filter(
            Driver.user_id == current_user.id
        ).first()

        if not driver:
            raise HTTPException(
                status_code=404,
                detail="Driver profile not found"
            )

        return db.query(Order).filter(
            Order.assigned_driver_id == driver.id
        ).order_by(Order.id.asc()).all()


@router.get("/{order_id}", response_model=OrderResponse)
def get_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "merchant", "driver"))
):
    order = db.query(Order).filter(Order.id == order_id).first()

    if not order:
        raise HTTPException(
            status_code=404,
            detail="Order not found"
        )

    if current_user.role.value == "merchant":
        merchant = db.query(Merchant).filter(
            Merchant.user_id == current_user.id
        ).first()

        if not merchant or order.merchant_id != merchant.id:
            raise HTTPException(
                status_code=403,
                detail="You can only view your own orders"
            )

    if current_user.role.value == "driver":
        driver = db.query(Driver).filter(
            Driver.user_id == current_user.id
        ).first()

        if not driver or order.assigned_driver_id != driver.id:
            raise HTTPException(
                status_code=403,
                detail="You can only view assigned orders"
            )

    return order


@router.put("/{order_id}", response_model=OrderResponse)
def update_order(
    order_id: int,
    payload: OrderUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "merchant"))
):
    order = db.query(Order).filter(Order.id == order_id).first()

    if not order:
        raise HTTPException(
            status_code=404,
            detail="Order not found"
        )

    if current_user.role.value == "merchant":
        merchant = db.query(Merchant).filter(
            Merchant.user_id == current_user.id
        ).first()

        if not merchant or order.merchant_id != merchant.id:
            raise HTTPException(
                status_code=403,
                detail="You can only update your own orders"
            )

        if order.current_status.value != "created":
            raise HTTPException(
                status_code=400,
                detail="Merchant can only update orders before assignment"
            )

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(order, field, value)

    db.commit()
    db.refresh(order)

    return order


@router.put("/{order_id}/assign-driver", response_model=OrderResponse)
def assign_driver(
    order_id: int,
    payload: AssignDriverRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin"))
):
    order = db.query(Order).filter(Order.id == order_id).first()

    if not order:
        raise HTTPException(
            status_code=404,
            detail="Order not found"
        )

    driver = db.query(Driver).filter(Driver.id == payload.driver_id).first()

    if not driver:
        raise HTTPException(
            status_code=404,
            detail="Driver not found"
        )

    if driver.availability_status.value == "inactive":
        raise HTTPException(
            status_code=400,
            detail="Cannot assign inactive driver"
        )

    if order.current_status.value not in ["created"]:
        raise HTTPException(
            status_code=400,
            detail="Only created orders can be assigned"
        )

    order.assigned_driver_id = driver.id
    order.current_status = OrderStatus.assigned

    create_timeline_entry(
        db=db,
        order_id=order.id,
        status=OrderStatus.assigned,
        updated_by_user_id=current_user.id,
        notes=payload.notes
    )

    db.commit()
    db.refresh(order)

    return order


@router.put("/{order_id}/status", response_model=OrderResponse)
def update_order_status(
    order_id: int,
    payload: StatusUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "driver"))
):
    order = db.query(Order).filter(Order.id == order_id).first()

    if not order:
        raise HTTPException(
            status_code=404,
            detail="Order not found"
        )

    if payload.status not in [status.value for status in OrderStatus]:
        raise HTTPException(
            status_code=400,
            detail="Invalid order status"
        )

    if current_user.role.value == "driver":
        driver = db.query(Driver).filter(
            Driver.user_id == current_user.id
        ).first()

        if not driver or order.assigned_driver_id != driver.id:
            raise HTTPException(
                status_code=403,
                detail="You can only update assigned orders"
            )

    allowed_next_statuses = get_allowed_next_statuses(order.current_status.value)

    if payload.status not in allowed_next_statuses:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot change status from {order.current_status.value} to {payload.status}"
        )

    order.current_status = OrderStatus(payload.status)

    create_timeline_entry(
        db=db,
        order_id=order.id,
        status=OrderStatus(payload.status),
        updated_by_user_id=current_user.id,
        notes=payload.notes
    )

    db.commit()
    db.refresh(order)

    return order


@router.get("/{order_id}/timeline", response_model=list[OrderTimelineResponse])
def get_order_timeline(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "merchant", "driver"))
):
    order = db.query(Order).filter(Order.id == order_id).first()

    if not order:
        raise HTTPException(
            status_code=404,
            detail="Order not found"
        )

    if current_user.role.value == "merchant":
        merchant = db.query(Merchant).filter(
            Merchant.user_id == current_user.id
        ).first()

        if not merchant or order.merchant_id != merchant.id:
            raise HTTPException(
                status_code=403,
                detail="You can only view your own order timeline"
            )

    if current_user.role.value == "driver":
        driver = db.query(Driver).filter(
            Driver.user_id == current_user.id
        ).first()

        if not driver or order.assigned_driver_id != driver.id:
            raise HTTPException(
                status_code=403,
                detail="You can only view assigned order timeline"
            )

    return db.query(OrderStatusHistory).filter(
        OrderStatusHistory.order_id == order_id
    ).order_by(OrderStatusHistory.id.asc()).all()