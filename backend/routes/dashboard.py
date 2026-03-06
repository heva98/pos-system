from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, cast, Date
from datetime import datetime, date, timedelta
from typing import Optional
from core.database import get_db
from core.security import get_current_user, require_roles
from models.sale import Sale, SaleItem, SaleStatus
from models.product import Product

router = APIRouter()


@router.get("/")
def get_dashboard(db: Session = Depends(get_db), _=Depends(get_current_user)):
    today = date.today()
    today_start = datetime.combine(today, datetime.min.time())
    today_end = datetime.combine(today, datetime.max.time())

    # Today's sales
    today_sales = db.query(func.count(Sale.id), func.sum(Sale.total_amount)).filter(
        Sale.created_at.between(today_start, today_end),
        Sale.status == SaleStatus.completed,
    ).first()

    # This month
    month_start = today.replace(day=1)
    month_sales = db.query(func.sum(Sale.total_amount)).filter(
        Sale.created_at >= month_start,
        Sale.status == SaleStatus.completed,
    ).scalar() or 0

    # Low stock count
    low_stock_count = db.query(func.count(Product.id)).filter(
        Product.quantity_in_stock <= Product.reorder_level,
        Product.is_active == True,
    ).scalar()

    # Total products
    total_products = db.query(func.count(Product.id)).filter(Product.is_active == True).scalar()

    return {
        "today": {
            "transactions": today_sales[0] or 0,
            "revenue": round(today_sales[1] or 0, 2),
        },
        "this_month": {
            "revenue": round(month_sales, 2),
        },
        "inventory": {
            "total_products": total_products,
            "low_stock_items": low_stock_count,
        },
    }