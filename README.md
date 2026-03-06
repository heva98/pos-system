# 🛒 POS System — Supermarket & Pharmacy

A full-featured Point of Sale system built with **FastAPI + React + PostgreSQL**.
Supports both **Supermarket** and **Pharmacy** modes with switchable modules.

---

## 🗂 Project Structure

```
pos-system/
├── backend/              ← FastAPI Python backend
│   ├── core/             ← Config, DB, Security
│   ├── models/           ← SQLAlchemy database models
│   ├── routes/           ← API endpoint handlers
│   ├── schemas/          ← Pydantic request/response schemas
│   ├── migrations/       ← Alembic migration scripts
│   ├── main.py           ← App entry point
│   ├── seed.py           ← Seeds default users & categories
│   └── requirements.txt
└── frontend/             ← React frontend (coming next)
```

---

## ⚙️ Backend Setup

### 1. Prerequisites
- Python 3.11+
- PostgreSQL running locally

### 2. Create the database
```sql
CREATE DATABASE pos_db;
```

### 3. Install dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 4. Configure environment
```bash
cp .env.example .env
# Edit .env and set your DATABASE_URL and SECRET_KEY
```

### 5. Run database migrations
```bash
alembic init migrations   # only first time
alembic revision --autogenerate -m "initial"
alembic upgrade head
```
> Or skip Alembic for dev — `main.py` calls `Base.metadata.create_all()` on startup.

### 6. Seed the database
```bash
python seed.py
```

### 7. Start the server
```bash
uvicorn main:app --reload
```

- API: http://localhost:8000
- Swagger Docs: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

---

## 🔐 Default Credentials

| Role    | Username  | Password     |
|---------|-----------|--------------|
| Admin   | admin     | admin123     |
| Cashier | cashier1  | cashier123   |

> ⚠️ Change passwords immediately in production.

---

## 🔌 API Endpoints

| Module           | Endpoint                   |
|------------------|----------------------------|
| Auth             | POST /api/auth/login        |
| Users            | CRUD /api/users             |
| Products         | CRUD /api/products          |
| Categories       | CRUD /api/categories        |
| Suppliers        | CRUD /api/suppliers         |
| Customers        | CRUD /api/customers         |
| Sales            | CRUD /api/sales             |
| Purchase Orders  | CRUD /api/purchase-orders   |
| Dashboard        | GET  /api/dashboard         |
| Reports          | GET  /api/reports/*         |

---

## 🏪 Store Modes

Set `STORE_MODE` in `.env`:
- `supermarket` — enables purchase orders, supplier management, weighable items
- `pharmacy` — enables prescription tracking, expiry dates, batch numbers
- `both` — all modules active (default)

---

## 📋 User Roles

| Role         | Access                                      |
|--------------|---------------------------------------------|
| admin        | Full access                                 |
| manager      | Products, reports, purchase orders          |
| cashier      | Sales, customers, product lookup            |
| pharmacist   | Same as cashier + prescription management   |
