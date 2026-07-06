from pydantic import BaseModel
from typing import Optional, List
from decimal import Decimal
from datetime import datetime


class OrderCreate(BaseModel):
    customer_name: str
    customer_phone: str
    pickup_address: str
    delivery_address: str
    package_description: Optional[str] = None
    delivery_charge: Decimal = 0
    cod_amount: Decimal = 0


class OrderUpdate(BaseModel):
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    pickup_address: Optional[str] = None
    delivery_address: Optional[str] = None
    package_description: Optional[str] = None
    delivery_charge: Optional[Decimal] = None
    cod_amount: Optional[Decimal] = None


class AssignDriverRequest(BaseModel):
    driver_id: int
    notes: Optional[str] = "Assigned manually by admin"


class StatusUpdateRequest(BaseModel):
    status: str
    notes: Optional[str] = None


class OrderResponse(BaseModel):
    id: int
    order_number: str
    merchant_id: int
    assigned_driver_id: Optional[int]
    customer_name: str
    customer_phone: str
    pickup_address: str
    delivery_address: str
    package_description: Optional[str]
    delivery_charge: Decimal
    cod_amount: Decimal
    current_status: str
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


class OrderTimelineResponse(BaseModel):
    id: int
    order_id: int
    status: str
    updated_by_user_id: int
    notes: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True