from sqlalchemy import (
    Column, Integer, String, Float, Boolean,
    DateTime, ForeignKey, Text, Enum, Date
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from core.database import Base


class StoreModule(str, enum.Enum):
    general = "general"
    supermarket = "supermarket"
    pharmacy = "pharmacy"


class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    description = Column(Text, nullable=True)
    module = Column(Enum(StoreModule), default=StoreModule.general)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    products = relationship("Product", back_populates="category")


class Supplier(Base):
    __tablename__ = "suppliers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    contact_person = Column(String(100), nullable=True)
    phone = Column(String(20), nullable=True)
    email = Column(String(100), nullable=True)
    address = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    products = relationship("Product", back_populates="supplier")
    purchase_orders = relationship("PurchaseOrder", back_populates="supplier")


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False, index=True)
    barcode = Column(String(100), unique=True, index=True, nullable=True)
    sku = Column(String(100), unique=True, nullable=True)
    description = Column(Text, nullable=True)

    # Pricing
    cost_price = Column(Float, default=0.0, nullable=False)
    selling_price = Column(Float, nullable=False)
    tax_rate = Column(Float, default=0.0)  # percentage e.g. 16.0 for 16%

    # Inventory
    quantity_in_stock = Column(Float, default=0.0)
    reorder_level = Column(Float, default=10.0)
    unit = Column(String(30), default="pcs")  # pcs, kg, litres, etc.
    is_weighable = Column(Boolean, default=False)  # supermarket: loose items

    # Module flags
    module = Column(Enum(StoreModule), default=StoreModule.general)

    # Pharmacy-specific fields
    requires_prescription = Column(Boolean, default=False)
    expiry_date = Column(Date, nullable=True)
    batch_number = Column(String(100), nullable=True)
    manufacturer = Column(String(150), nullable=True)

    # Relations
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=True)
    category = relationship("Category", back_populates="products")
    supplier = relationship("Supplier", back_populates="products")

    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    sale_items = relationship("SaleItem", back_populates="product")
    purchase_order_items = relationship("PurchaseOrderItem", back_populates="product")