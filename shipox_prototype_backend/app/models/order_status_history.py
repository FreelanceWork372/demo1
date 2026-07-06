from sqlalchemy import Column, Integer, Text, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
from app.models.order import OrderStatus


class OrderStatusHistory(Base):
    __tablename__ = "order_status_history"

    id = Column(Integer, primary_key=True, index=True)

    order_id = Column(
        Integer,
        ForeignKey("orders.id"),
        nullable=False
    )

    status = Column(
        Enum(OrderStatus),
        nullable=False
    )

    updated_by_user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    notes = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    order = relationship("Order")
    updated_by = relationship("User")