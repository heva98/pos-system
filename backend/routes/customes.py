from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from core.database import get_db
from core.security import get_current_user, require_roles
from models.customer import Customer
from schemas.all import CustomerCreate, CustomerOut

router = APIRouter()


@router.get("/", response_model=List[CustomerOut])
def list_customers(
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    q = db.query(Customer).filter(Customer.is_active == True)
    if search:
        q = q.filter(Customer.full_name.ilike(f"%{search}%") | Customer.phone.ilike(f"%{search}%"))
    return q.all()


@router.post("/", response_model=CustomerOut)
def create_customer(data: CustomerCreate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    customer = Customer(**data.model_dump())
    db.add(customer)
    db.commit()
    db.refresh(customer)
    return customer


@router.get("/{customer_id}", response_model=CustomerOut)
def get_customer(customer_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    c = db.query(Customer).filter(Customer.id == customer_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Customer not found")
    return c


@router.patch("/{customer_id}", response_model=CustomerOut)
def update_customer(customer_id: int, data: CustomerCreate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    c = db.query(Customer).filter(Customer.id == customer_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Customer not found")
    for k, v in data.model_dump().items():
        setattr(c, k, v)
    db.commit()
    db.refresh(c)
    return c