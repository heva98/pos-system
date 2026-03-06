from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from core.config import settings
from core.database import engine, Base

# Import all models so tables are created
import models  # noqa

# Import routers
from routes import auth, users, products, categories, suppliers
from routes import customers, sales, purchase_orders, reports, dashboard

# Create tables (use Alembic in production, this is handy for dev)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="POS System for Supermarket & Pharmacy",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS — allow React frontend on localhost:5173
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register all routes under /api prefix
app.include_router(auth.router,prefix="/api/auth",tags=["Auth"])
app.include_router(users.router,prefix="/api/users",tags=["Users"])
app.include_router(products.router,prefix="/api/products",tags=["Products"])
app.include_router(categories.router,prefix="/api/categories",tags=["Categories"])
app.include_router(suppliers.router,prefix="/api/suppliers",tags=["Suppliers"])
app.include_router(customers.router,prefix="/api/customers",tags=["Customers"])
app.include_router(sales.router,prefix="/api/sales",tags=["Sales"])
app.include_router(purchase_orders.router,prefix="/api/purchase-orders",tags=["Purchase Orders"])
app.include_router(reports.router,prefix="/api/reports",tags=["Reports"])
app.include_router(dashboard.router,prefix="/api/dashboard",tags=["Dashboard"])


@app.get("/")
def root():
    return {
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "mode": settings.STORE_MODE,
        "docs": "/docs",
    }


@app.get("/health")
def health():
    return {"status": "ok"}