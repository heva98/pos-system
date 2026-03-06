from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, date
import uuid
from core.database import get_db
from core.security import get_current_user, require_roles
from models.sale import Sale, SaleItem, SaleStatus
from models.product import Product
from models.customer import Customer
from schemas.all import SaleCreate, SaleOut

router = APIRouter()


def generate_receipt_number() -> str:
    now = datetime.now()
    return f"RCP-{now.strftime('%Y%m%d')}-{str(uuid.uuid4())[:6].upper()}"


@router.post("/", response_model=SaleOut)
def create_sale(data: SaleCreate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    # 1. Validate all products and calculate totals
    sale_items = []
    subtotal = 0.0
    total_tax = 0.0

    for item_in in data.items:
        product = db.query(Product).filter(Product.id == item_in.product_id, Product.is_active == True).first()
        if not product:
            raise HTTPException(status_code=404, detail=f"Product {item_in.product_id} not found")
        if product.quantity_in_stock < item_in.quantity:
            raise HTTPException(status_code=400, detail=f"Insufficient stock for '{product.name}'. Available: {product.quantity_in_stock}")

        unit_price = product.selling_price
        item_discount = item_in.discount
        tax_amount = round((unit_price * item_in.quantity * product.tax_rate) / 100, 2)
        total_price = round((unit_price * item_in.quantity) - item_discount + tax_amount, 2)

        sale_items.append(SaleItem(
            product_id=product.id,
            quantity=item_in.quantity,
            unit_price=unit_price,
            discount=item_discount,
            tax_amount=tax_amount,
            total_price=total_price,
        ))

        subtotal += unit_price * item_in.quantity
        total_tax += tax_amount

        # 2. Deduct stock
        product.quantity_in_stock -= item_in.quantity

    subtotal = round(subtotal, 2)
    total_tax = round(total_tax, 2)
    total_amount = round(subtotal + total_tax - data.discount_amount, 2)
    change = round((data.amount_tendered or total_amount) - total_amount, 2)

    # 3. Create the sale
    sale = Sale(
        receipt_number=generate_receipt_number(),
        subtotal=subtotal,
        tax_amount=total_tax,
        discount_amount=data.discount_amount,
        total_amount=total_amount,
        amount_tendered=data.amount_tendered,
        change_amount=max(change, 0),
        payment_method=data.payment_method,
        status=SaleStatus.completed,
        cashier_id=current_user.id,
        customer_id=data.customer_id,
        notes=data.notes,
        prescription_ref=data.prescription_ref,
        items=sale_items,
    )
    db.add(sale)

    # 4. Add loyalty points if customer is linked (1 point per unit of currency)
    if data.customer_id:
        customer = db.query(Customer).filter(Customer.id == data.customer_id).first()
        if customer:
            customer.loyalty_points += round(total_amount * 0.01, 2)

    db.commit()
    db.refresh(sale)
    return sale


@router.get("/", response_model=List[SaleOut])
def list_sales(
    from_date: Optional[date] = None,
    to_date: Optional[date] = None,
    cashier_id: Optional[int] = None,
    limit: int = Query(50, le=200),
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    q = db.query(Sale)
    if from_date:
        q = q.filter(Sale.created_at >= datetime.combine(from_date, datetime.min.time()))
    if to_date:
        q = q.filter(Sale.created_at <= datetime.combine(to_date, datetime.max.time()))
    if cashier_id:
        q = q.filter(Sale.cashier_id == cashier_id)
    return q.order_by(Sale.created_at.desc()).limit(limit).all()


@router.get("/{sale_id}", response_model=SaleOut)
def get_sale(sale_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    sale = db.query(Sale).filter(Sale.id == sale_id).first()
    if not sale:
        raise HTTPException(status_code=404, detail="Sale not found")
    return sale


@router.post("/{sale_id}/void")
def void_sale(sale_id: int, db: Session = Depends(get_db), _=Depends(require_roles("admin", "manager"))):
    sale = db.query(Sale).filter(Sale.id == sale_id).first()
    if not sale:
        raise HTTPException(status_code=404, detail="Sale not found")
    if sale.status != SaleStatus.completed:
        raise HTTPException(status_code=400, detail="Only completed sales can be voided")

    # Restore stock
    for item in sale.items:
        product = db.query(Product).filter(Product.id == item.product_id).first()
        if product:
            product.quantity_in_stock += item.quantity

    sale.status = SaleStatus.voided
    db.commit()
    return {"detail": "Sale voided and stock restored"}