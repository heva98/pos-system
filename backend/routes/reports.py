from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, date
from typing import Optional
from core.database import get_db
from core.security import require_roles
from models.sale import Sale, SaleItem, SaleStatus
from models.product import Product

router = APIRouter()


@router.get("/sales-summary")
def sales_summary(
    from_date: date = Query(...),
    to_date: date = Query(...),
    db: Session = Depends(get_db),
    _=Depends(require_roles("admin", "manager")),
):
    start = datetime.combine(from_date, datetime.min.time())
    end = datetime.combine(to_date, datetime.max.time())

    result = db.query(
        func.count(Sale.id).label("total_transactions"),
        func.sum(Sale.subtotal).label("subtotal"),
        func.sum(Sale.tax_amount).label("tax"),
        func.sum(Sale.discount_amount).label("discounts"),
        func.sum(Sale.total_amount).label("revenue"),
    ).filter(
        Sale.created_at.between(start, end),
        Sale.status == SaleStatus.completed,
    ).first()

    return {
        "from_date": str(from_date),
        "to_date": str(to_date),
        "total_transactions": result.total_transactions or 0,
        "subtotal": round(result.subtotal or 0, 2),
        "tax": round(result.tax or 0, 2),
        "discounts": round(result.discounts or 0, 2),
        "revenue": round(result.revenue or 0, 2),
    }


@router.get("/top-products")
def top_products(
    from_date: date = Query(...),
    to_date: date = Query(...),
    limit: int = Query(10, le=50),
    db: Session = Depends(get_db),
    _=Depends(require_roles("admin", "manager")),
):
    start = datetime.combine(from_date, datetime.min.time())
    end = datetime.combine(to_date, datetime.max.time())

    results = (
        db.query(
            Product.id,
            Product.name,
            func.sum(SaleItem.quantity).label("qty_sold"),
            func.sum(SaleItem.total_price).label("revenue"),
        )
        .join(SaleItem, SaleItem.product_id == Product.id)
        .join(Sale, Sale.id == SaleItem.sale_id)
        .filter(Sale.created_at.between(start, end), Sale.status == SaleStatus.completed)
        .group_by(Product.id, Product.name)
        .order_by(func.sum(SaleItem.total_price).desc())
        .limit(limit)
        .all()
    )

    return [
        {"product_id": r.id, "name": r.name, "qty_sold": round(r.qty_sold, 2), "revenue": round(r.revenue, 2)}
        for r in results
    ]


@router.get("/low-stock")
def low_stock_report(db: Session = Depends(get_db), _=Depends(require_roles("admin", "manager"))):
    products = db.query(Product).filter(
        Product.quantity_in_stock <= Product.reorder_level,
        Product.is_active == True,
    ).order_by(Product.quantity_in_stock).all()

    return [
        {
            "id": p.id,
            "name": p.name,
            "barcode": p.barcode,
            "current_stock": p.quantity_in_stock,
            "reorder_level": p.reorder_level,
            "unit": p.unit,
        }
        for p in products
    ]