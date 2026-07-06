from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Numeric, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import enum


class OrderStatus(str, enum.Enum):
    created = "created"
    assigned = "assigned"
    picked_up = "picked_up"
    in_transit = "in_transit"
    delivered = "delivered"
    failed = "failed"
    cancelled = "cancelled"
    returned = "returned"


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)

    order_number = Column(
        String(50),
        unique=True,
        index=True,
        nullable=False
    )

    merchant_id = Column(
        Integer,
        ForeignKey("merchants.id"),
        nullable=False
    )

    assigned_driver_id = Column(
        Integer,
        ForeignKey("drivers.id"),
        nullable=True
    )

    customer_name = Column(String(150), nullable=False)
    customer_phone = Column(String(30), nullable=False)

    pickup_address = Column(Text, nullable=False)
    delivery_address = Column(Text, nullable=False)

    package_description = Column(Text, nullable=True)

    delivery_charge = Column(Numeric(10, 2), default=0)
    cod_amount = Column(Numeric(10, 2), default=0)

    current_status = Column(
        Enum(OrderStatus),
        default=OrderStatus.created,
        nullable=False
    )

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now()
    )

    merchant = relationship("Merchant")
    assigned_driver = relationship("Driver")