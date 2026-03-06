from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from core.database import get_db
from core.security import require_roles, get_current_user
from models.product import Product
from schemas.all import ProductCreate, ProductUpdate, ProductOut

router = APIRouter()


@router.get("/", response_model=List[ProductOut])
def list_products(
    search: Optional[str] = Query(None),
    category_id: Optional[int] = None,
    module: Optional[str] = None,
    low_stock: bool = False,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    q = db.query(Product).filter(Product.is_active == True)
    if search:
        q = q.filter(Product.name.ilike(f"%{search}%") | Product.barcode.ilike(f"%{search}%"))
    if category_id:
        q = q.filter(Product.category_id == category_id)
    if module:
        q = q.filter(Product.module == module)
    if low_stock:
        q = q.filter(Product.quantity_in_stock <= Product.reorder_level)
    return q.order_by(Product.name).all()


@router.get("/barcode/{barcode}", response_model=ProductOut)
def get_by_barcode(barcode: str, db: Session = Depends(get_db), _=Depends(get_current_user)):
    product = db.query(Product).filter(Product.barcode == barcode, Product.is_active == True).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@router.post("/", response_model=ProductOut)
def create_product(data: ProductCreate, db: Session = Depends(get_db), _=Depends(require_roles("admin", "manager"))):
    product = Product(**data.model_dump())
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


@router.get("/{product_id}", response_model=ProductOut)
def get_product(product_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@router.patch("/{product_id}", response_model=ProductOut)
def update_product(product_id: int, data: ProductUpdate, db: Session = Depends(get_db), _=Depends(require_roles("admin", "manager"))):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(product, k, v)
    db.commit()
    db.refresh(product)
    return product


@router.delete("/{product_id}")
def delete_product(product_id: int, db: Session = Depends(get_db), _=Depends(require_roles("admin"))):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    product.is_active = False
    db.commit()
    return {"detail": "Product deactivated"}