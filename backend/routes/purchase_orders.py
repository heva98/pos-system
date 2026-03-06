from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
import uuid
from core.database import get_db
from core.security import get_current_user, require_roles
from models.purchase_order import PurchaseOrder, PurchaseOrderItem, POStatus
from models.product import Product
from schemas.all import PurchaseOrderCreate, PurchaseOrderOut

router = APIRouter()


def generate_po_number() -> str:
    return f"PO-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:6].upper()}"


@router.get("/", response_model=List[PurchaseOrderOut])
def list_purchase_orders(db: Session = Depends(get_db), _=Depends(require_roles("admin", "manager"))):
    return db.query(PurchaseOrder).order_by(PurchaseOrder.created_at.desc()).all()


@router.post("/", response_model=PurchaseOrderOut)
def create_purchase_order(data: PurchaseOrderCreate, db: Session = Depends(get_db), current_user=Depends(require_roles("admin", "manager"))):
    items = []
    total = 0.0
    for item_in in data.items:
        product = db.query(Product).filter(Product.id == item_in.product_id).first()
        if not product:
            raise HTTPException(status_code=404, detail=f"Product {item_in.product_id} not found")
        total_cost = round(item_in.quantity_ordered * item_in.unit_cost, 2)
        total += total_cost
        items.append(PurchaseOrderItem(
            product_id=item_in.product_id,
            quantity_ordered=item_in.quantity_ordered,
            unit_cost=item_in.unit_cost,
            total_cost=total_cost,
        ))

    po = PurchaseOrder(
        po_number=generate_po_number(),
        supplier_id=data.supplier_id,
        total_amount=round(total, 2),
        notes=data.notes,
        expected_date=data.expected_date,
        created_by=current_user.id,
        items=items,
    )
    db.add(po)
    db.commit()
    db.refresh(po)
    return po


@router.post("/{po_id}/receive")
def receive_purchase_order(po_id: int, db: Session = Depends(get_db), _=Depends(require_roles("admin", "manager"))):
    """Mark a PO as fully received and update stock levels."""
    po = db.query(PurchaseOrder).filter(PurchaseOrder.id == po_id).first()
    if not po:
        raise HTTPException(status_code=404, detail="Purchase order not found")
    if po.status == POStatus.received:
        raise HTTPException(status_code=400, detail="Already received")

    for item in po.items:
        product = db.query(Product).filter(Product.id == item.product_id).first()
        if product:
            product.quantity_in_stock += item.quantity_ordered
            product.cost_price = item.unit_cost  # update cost price
            item.quantity_received = item.quantity_ordered

    po.status = POStatus.received
    po.received_at = datetime.utcnow()
    db.commit()
    return {"detail": "Stock updated successfully"}


@router.get("/{po_id}", response_model=PurchaseOrderOut)
def get_purchase_order(po_id: int, db: Session = Depends(get_db), _=Depends(require_roles("admin", "manager"))):
    po = db.query(PurchaseOrder).filter(PurchaseOrder.id == po_id).first()
    if not po:
        raise HTTPException(status_code=404, detail="Not found")
    return po