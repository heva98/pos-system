from sqlalchemy import (
    Column, Integer, Float, String, DateTime,
    ForeignKey, Enum, Text, Boolean
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from core.database import Base


class PaymentMethod(str, enum.Enum):
    cash = "cash"
    card = "card"
    mobile_money = "mobile_money"
    credit = "credit"


class SaleStatus(str, enum.Enum):
    completed = "completed"
    refunded = "refunded"
    voided = "voided"


class Sale(Base):
    __tablename__ = "sales"

    id = Column(Integer, primary_key=True, index=True)
    receipt_number = Column(String(50), unique=True, index=True, nullable=False)

    # Totals
    subtotal = Column(Float, nullable=False)
    tax_amount = Column(Float, default=0.0)
    discount_amount = Column(Float, default=0.0)
    total_amount = Column(Float, nullable=False)
    amount_tendered = Column(Float, nullable=True)  # cash given by customer
    change_amount = Column(Float, default=0.0)

    payment_method = Column(Enum(PaymentMethod), default=PaymentMethod.cash)
    status = Column(Enum(SaleStatus), default=SaleStatus.completed)
    notes = Column(Text, nullable=True)

    # Pharmacy: prescription reference
    prescription_ref = Column(String(100), nullable=True)

    # Relations
    cashier_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=True)
    cashier = relationship("User", back_populates="sales")
    customer = relationship("Customer", back_populates="sales")
    items = relationship("SaleItem", back_populates="sale", cascade="all, delete-orphan")

    created_at = Column(DateTime(timezone=True), server_default=func.now())


class SaleItem(Base):
    __tablename__ = "sale_items"

    id = Column(Integer, primary_key=True, index=True)
    sale_id = Column(Integer, ForeignKey("sales.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)

    quantity = Column(Float, nullable=False)
    unit_price = Column(Float, nullable=False)
    discount = Column(Float, default=0.0)
    tax_amount = Column(Float, default=0.0)
    total_price = Column(Float, nullable=False)

    sale = relationship("Sale", back_populates="items")
    product = relationship("Product", back_populates="sale_items")