"""
Run this script once to seed the database with initial data:
  cd backend
  python seed.py
"""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from core.database import SessionLocal, engine, Base
from core.security import hash_password
import models  # ensures all tables are created

Base.metadata.create_all(bind=engine)

db = SessionLocal()

try:
    from models.user import User, UserRole
    from models.product import Category, Supplier, StoreModule

    # ── Admin user ───────────────────────────────────────────────────────────
    if not db.query(User).filter(User.username == "admin").first():
        db.add(User(
            full_name="System Admin",
            username="admin",
            email="admin@pos.local",
            hashed_password=hash_password("admin123"),
            role=UserRole.admin,
        ))
        print("✓ Admin user created  (username: admin / password: admin123)")

    # ── Cashier demo user ────────────────────────────────────────────────────
    if not db.query(User).filter(User.username == "cashier1").first():
        db.add(User(
            full_name="Demo Cashier",
            username="cashier1",
            email="cashier@pos.local",
            hashed_password=hash_password("cashier123"),
            role=UserRole.cashier,
        ))
        print("✓ Cashier user created (username: cashier1 / password: cashier123)")

    # ── Default categories ───────────────────────────────────────────────────
    default_categories = [
        ("Groceries", StoreModule.supermarket),
        ("Beverages", StoreModule.supermarket),
        ("Dairy", StoreModule.supermarket),
        ("Household", StoreModule.supermarket),
        ("Prescription Drugs", StoreModule.pharmacy),
        ("OTC Medicines", StoreModule.pharmacy),
        ("Supplements", StoreModule.pharmacy),
        ("Personal Care", StoreModule.general),
    ]
    for name, module in default_categories:
        if not db.query(Category).filter(Category.name == name).first():
            db.add(Category(name=name, module=module))
    print(f"✓ {len(default_categories)} default categories added")

    # ── Default supplier ─────────────────────────────────────────────────────
    if not db.query(Supplier).filter(Supplier.name == "Default Supplier").first():
        db.add(Supplier(name="Default Supplier", phone="+255700000000"))
        print("✓ Default supplier created")

    db.commit()
    print("\n🎉 Database seeded successfully!")
    print("   Start the server: uvicorn main:app --reload")
    print("   API docs:         http://localhost:8000/docs")

except Exception as e:
    db.rollback()
    print(f"❌ Error: {e}")
    raise
finally:
    db.close()