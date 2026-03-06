from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime, date
from models.user import UserRole
from models.product import StoreModule
from models.sale import PaymentMethod, SaleStatus
from models.purchase_order import POStatus


# ─── Auth ────────────────────────────────────────────────────────────────────

class UserOut(BaseModel):
    id: int
    full_name: str
    username: str
    email: Optional[str]
    role: UserRole
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserOut


# ─── Users ───────────────────────────────────────────────────────────────────

class UserCreate(BaseModel):
    full_name: str
    username: str
    email: Optional[str] = None
    password: str
    role: UserRole = UserRole.cashier


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None
    password: Optional[str] = None


# ─── Categories ──────────────────────────────────────────────────────────────

class CategoryCreate(BaseModel):
    name: str
    description: Optional[str] = None
    module: StoreModule = StoreModule.general


class CategoryOut(BaseModel):
    id: int
    name: str
    description: Optional[str]
    module: StoreModule
    is_active: bool

    class Config:
        from_attributes = True


# ─── Suppliers ───────────────────────────────────────────────────────────────

class SupplierCreate(BaseModel):
    name: str
    contact_person: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None


class SupplierOut(BaseModel):
    id: int
    name: str
    contact_person: Optional[str]
    phone: Optional[str]
    email: Optional[str]
    address: Optional[str]
    is_active: bool

    class Config:
        from_attributes = True


# ─── Products ────────────────────────────────────────────────────────────────

class ProductCreate(BaseModel):
    name: str
    barcode: Optional[str] = None
    sku: Optional[str] = None
    description: Optional[str] = None
    cost_price: float
    selling_price: float
    tax_rate: float = 0.0
    quantity_in_stock: float = 0.0
    reorder_level: float = 10.0
    unit: str = "pcs"
    is_weighable: bool = False
    module: StoreModule = StoreModule.general
    requires_prescription: bool = False
    expiry_date: Optional[date] = None
    batch_number: Optional[str] = None
    manufacturer: Optional[str] = None
    category_id: Optional[int] = None
    supplier_id: Optional[int] = None


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    barcode: Optional[str] = None
    selling_price: Optional[float] = None
    cost_price: Optional[float] = None
    tax_rate: Optional[float] = None
    quantity_in_stock: Optional[float] = None
    reorder_level: Optional[float] = None
    is_active: Optional[bool] = None
    expiry_date: Optional[date] = None
    batch_number: Optional[str] = None
    requires_prescription: Optional[bool] = None


class ProductOut(BaseModel):
    id: int
    name: str
    barcode: Optional[str]
    sku: Optional[str]
    description: Optional[str]
    cost_price: float
    selling_price: float
    tax_rate: float
    quantity_in_stock: float
    reorder_level: float
    unit: str
    is_weighable: bool
    module: StoreModule
    requires_prescription: bool
    expiry_date: Optional[date]
    batch_number: Optional[str]
    manufacturer: Optional[str]
    category_id: Optional[int]
    supplier_id: Optional[int]
    is_active: bool

    class Config:
        from_attributes = True


# ─── Customers ───────────────────────────────────────────────────────────────

class CustomerCreate(BaseModel):
    full_name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None


class CustomerOut(BaseModel):
    id: int
    full_name: str
    phone: Optional[str]
    email: Optional[str]
    loyalty_points: float
    is_active: bool

    class Config:
        from_attributes = True


# ─── Sales ───────────────────────────────────────────────────────────────────

class SaleItemIn(BaseModel):
    product_id: int
    quantity: float
    discount: float = 0.0


class SaleCreate(BaseModel):
    items: List[SaleItemIn]
    payment_method: PaymentMethod = PaymentMethod.cash
    customer_id: Optional[int] = None
    amount_tendered: Optional[float] = None
    discount_amount: float = 0.0
    notes: Optional[str] = None
    prescription_ref: Optional[str] = None


class SaleItemOut(BaseModel):
    id: int
    product_id: int
    quantity: float
    unit_price: float
    discount: float
    tax_amount: float
    total_price: float

    class Config:
        from_attributes = True


class SaleOut(BaseModel):
    id: int
    receipt_number: str
    subtotal: float
    tax_amount: float
    discount_amount: float
    total_amount: float
    amount_tendered: Optional[float]
    change_amount: float
    payment_method: PaymentMethod
    status: SaleStatus
    cashier_id: int
    customer_id: Optional[int]
    items: List[SaleItemOut]
    created_at: datetime

    class Config:
        from_attributes = True


# ─── Purchase Orders ─────────────────────────────────────────────────────────

class POItemIn(BaseModel):
    product_id: int
    quantity_ordered: float
    unit_cost: float


class PurchaseOrderCreate(BaseModel):
    supplier_id: int
    items: List[POItemIn]
    notes: Optional[str] = None
    expected_date: Optional[datetime] = None


class POItemOut(BaseModel):
    id: int
    product_id: int
    quantity_ordered: float
    quantity_received: float
    unit_cost: float
    total_cost: float

    class Config:
        from_attributes = True


class PurchaseOrderOut(BaseModel):
    id: int
    po_number: str
    supplier_id: int
    status: POStatus
    total_amount: float
    notes: Optional[str]
    created_at: datetime
    items: List[POItemOut]

    class Config:
        from_attributes = True