# Shipox Prototype Backend

This README documents the backend development process completed so far for the Shipox-style delivery management prototype.

## 1. Project Overview

This backend is the Phase 1 prototype API for a Shipox-style logistics/delivery management system.

The current backend supports the core operational flow:

```text
Merchant creates order
→ Admin assigns order to driver
→ Driver updates delivery status
→ Timeline records every event
→ Dashboards show role-based summaries
```

The backend is built with:

| Layer | Technology |
|---|---|
| Backend Framework | FastAPI |
| Database | PostgreSQL |
| ORM | SQLAlchemy |
| Authentication | JWT Bearer Token |
| Password Hashing | Passlib + bcrypt |
| API Testing | Swagger UI / FastAPI Docs |
| Local Server | Uvicorn |

---

## 2. Current Backend Status

Completed backend modules:

- FastAPI project setup
- PostgreSQL database connection
- Database models
- JWT authentication
- Role-based access control
- Admin seed user
- User creation
- Merchant profile creation
- Driver profile creation
- Order creation
- Driver assignment
- Order status updates
- Order timeline/history
- Dashboard APIs for admin, merchant, and driver

The backend core for Phase 1 is complete.

---

## 3. Folder Structure

Current backend structure:

```text
shipox_prototype_backend/
│
├── app/
│   ├── __init__.py
│   ├── main.py
│   ├── config.py
│   ├── database.py
│   │
│   ├── models/
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── merchant.py
│   │   ├── driver.py
│   │   ├── order.py
│   │   └── order_status_history.py
│   │
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── auth_schema.py
│   │   ├── user_schema.py
│   │   ├── merchant_schema.py
│   │   ├── driver_schema.py
│   │   └── order_schema.py
│   │
│   ├── routers/
│   │   ├── __init__.py
│   │   ├── auth_router.py
│   │   ├── user_router.py
│   │   ├── merchant_router.py
│   │   ├── driver_router.py
│   │   ├── order_router.py
│   │   └── dashboard_router.py
│   │
│   ├── core/
│   │   ├── __init__.py
│   │   ├── security.py
│   │   └── dependencies.py
│   │
│   └── utils/
│       ├── __init__.py
│       └── seed_admin.py
│
├── requirements.txt
├── .env
└── README.md
```

---

## 4. Environment Setup

### 4.1 Create Project Folder

Create and open the backend folder:

```powershell
cd "C:\Users\umara\OneDrive\Desktop\Shipox Prototype\shipox_prototype_backend"
```

### 4.2 Install Required Packages

The backend uses the following packages:

```txt
fastapi
uvicorn
sqlalchemy
psycopg2-binary
alembic
python-dotenv
passlib[bcrypt]
python-jose[cryptography]
pydantic
pydantic-settings
email-validator
```

Install them with:

```powershell
python -m pip install -r requirements.txt
```

If `bcrypt` causes compatibility issues, use:

```powershell
python -m pip uninstall bcrypt -y
python -m pip install bcrypt==4.0.1
```

---

## 5. PostgreSQL Setup

### 5.1 Create Database

Using pgAdmin or SQL Shell, create the database:

```sql
CREATE DATABASE shipox_prototype;
```

### 5.2 `.env` File

Create `.env` inside the project root:

```env
PROJECT_NAME=Shipox Prototype API
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/shipox_prototype
SECRET_KEY=shipox_prototype_super_secret_key_change_later_2026
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
```

If the PostgreSQL password contains `@`, encode it as `%40`.

Example:

```env
DATABASE_URL=postgresql://postgres:umar%401234@localhost:5432/shipox_prototype
```

This issue was encountered during setup when PostgreSQL interpreted part of the password as the host.

---

## 6. Core Backend Files

### 6.1 `app/config.py`

Loads environment variables from `.env` using `pydantic-settings`.

Responsibilities:

- project name
- database URL
- JWT secret key
- JWT algorithm
- token expiry time

### 6.2 `app/database.py`

Creates:

- SQLAlchemy engine
- database session factory
- declarative base
- reusable `get_db()` dependency

### 6.3 `app/main.py`

Main FastAPI application file.

Responsibilities:

- create FastAPI app
- configure CORS
- create database tables using SQLAlchemy metadata
- include routers
- expose health check endpoint

Current included routers:

```python
app.include_router(auth_router.router)
app.include_router(user_router.router)
app.include_router(merchant_router.router)
app.include_router(driver_router.router)
app.include_router(order_router.router)
app.include_router(dashboard_router.router)
```

---

## 7. Database Models

### 7.1 `users`

Stores all login users.

Fields:

- `id`
- `name`
- `email`
- `password_hash`
- `phone`
- `role`
- `is_active`
- `created_at`
- `updated_at`

Allowed roles:

```text
admin
merchant
driver
```

### 7.2 `merchants`

Stores merchant/business profile details.

Fields:

- `id`
- `user_id`
- `business_name`
- `contact_person`
- `pickup_address`
- `created_at`
- `updated_at`

Relationship:

```text
users.id → merchants.user_id
```

### 7.3 `drivers`

Stores driver profile details.

Fields:

- `id`
- `user_id`
- `availability_status`
- `created_at`
- `updated_at`

Allowed availability statuses:

```text
available
busy
inactive
```

Relationship:

```text
users.id → drivers.user_id
```

### 7.4 `orders`

Stores delivery orders.

Fields:

- `id`
- `order_number`
- `merchant_id`
- `assigned_driver_id`
- `customer_name`
- `customer_phone`
- `pickup_address`
- `delivery_address`
- `package_description`
- `delivery_charge`
- `cod_amount`
- `current_status`
- `created_at`
- `updated_at`

Allowed order statuses:

```text
created
assigned
picked_up
in_transit
delivered
failed
cancelled
returned
```

Relationships:

```text
merchants.id → orders.merchant_id
drivers.id → orders.assigned_driver_id
```

### 7.5 `order_status_history`

Stores the timeline/history of each order.

Fields:

- `id`
- `order_id`
- `status`
- `updated_by_user_id`
- `notes`
- `created_at`

Relationships:

```text
orders.id → order_status_history.order_id
users.id → order_status_history.updated_by_user_id
```

---

## 8. Authentication and Authorization

### 8.1 Password Hashing

Password hashing is handled in:

```text
app/core/security.py
```

Functions:

- `hash_password()`
- `verify_password()`
- `create_access_token()`

### 8.2 JWT Authentication

JWT authentication is used for protected routes.

Login returns:

```json
{
  "access_token": "token_here",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "name": "System Admin",
    "email": "admin@shipox.local",
    "role": "admin"
  }
}
```

### 8.3 Bearer Authorization

Protected routes use HTTP Bearer token authorization.

In Swagger:

1. Click `Authorize`.
2. Paste only the token.
3. Do not paste email/password.
4. Do not manually add `Bearer` if the Swagger Bearer field is already used.

### 8.4 Role-Based Access

Role checks are handled in:

```text
app/core/dependencies.py
```

Important helpers:

- `get_current_user()`
- `require_role()`

Example:

```python
current_user: User = Depends(require_role("admin"))
```

---

## 9. Admin Seed User

The first admin user is created using:

```text
app/utils/seed_admin.py
```

Run:

```powershell
python -m app.utils.seed_admin
```

Default admin credentials:

```text
Email: admin@shipox.local
Password: admin123
```

---

## 10. API Modules Completed

## 10.1 Authentication APIs

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/auth/login` | Login and get JWT token |
| GET | `/auth/me` | Get current authenticated user |

Test login body:

```json
{
  "email": "admin@shipox.local",
  "password": "admin123"
}
```

---

## 10.2 User APIs

| Method | Endpoint | Purpose | Access |
|---|---|---|---|
| GET | `/users/` | List all users | Admin |
| POST | `/users/` | Create user | Admin |
| GET | `/users/{user_id}` | Get specific user | Admin |
| PUT | `/users/{user_id}` | Update user | Admin |

Example merchant user:

```json
{
  "name": "Demo Merchant",
  "email": "merchant@shipox.local",
  "password": "merchant123",
  "phone": "9999999999",
  "role": "merchant"
}
```

Example driver user:

```json
{
  "name": "Demo Driver",
  "email": "driver@shipox.local",
  "password": "driver123",
  "phone": "8888888888",
  "role": "driver"
}
```

---

## 10.3 Merchant APIs

| Method | Endpoint | Purpose | Access |
|---|---|---|---|
| GET | `/merchants/` | List merchant profiles | Admin |
| POST | `/merchants/` | Create merchant profile | Admin |
| GET | `/merchants/me` | Get own merchant profile | Merchant |
| GET | `/merchants/{merchant_id}` | Get merchant by ID | Admin |
| PUT | `/merchants/{merchant_id}` | Update merchant profile | Admin |

Example merchant profile:

```json
{
  "user_id": 2,
  "business_name": "Demo Store",
  "contact_person": "Demo Merchant",
  "pickup_address": "Demo Pickup Address"
}
```

---

## 10.4 Driver APIs

| Method | Endpoint | Purpose | Access |
|---|---|---|---|
| GET | `/drivers/` | List driver profiles | Admin |
| POST | `/drivers/` | Create driver profile | Admin |
| GET | `/drivers/me` | Get own driver profile | Driver |
| GET | `/drivers/{driver_id}` | Get driver by ID | Admin |
| PUT | `/drivers/{driver_id}` | Update driver availability | Admin / Driver |

Example driver profile:

```json
{
  "user_id": 3,
  "availability_status": "available"
}
```

---

## 10.5 Order APIs

| Method | Endpoint | Purpose | Access |
|---|---|---|---|
| POST | `/orders/` | Create order | Merchant |
| GET | `/orders/` | Get role-based orders | Admin / Merchant / Driver |
| GET | `/orders/{order_id}` | Get order details | Admin / Merchant / Driver |
| PUT | `/orders/{order_id}` | Update order | Admin / Merchant |
| PUT | `/orders/{order_id}/assign-driver` | Assign driver | Admin |
| PUT | `/orders/{order_id}/status` | Update order status | Admin / Driver |
| GET | `/orders/{order_id}/timeline` | Get order timeline | Admin / Merchant / Driver |

Example order creation body:

```json
{
  "customer_name": "Test Customer",
  "customer_phone": "7777777777",
  "pickup_address": "Demo Pickup Address",
  "delivery_address": "Demo Delivery Address",
  "package_description": "Small test package",
  "delivery_charge": 50,
  "cod_amount": 500
}
```

Example driver assignment body:

```json
{
  "driver_id": 1,
  "notes": "Assigned to Demo Driver"
}
```

Example status update body:

```json
{
  "status": "picked_up",
  "notes": "Package picked up"
}
```

---

## 10.6 Dashboard APIs

| Method | Endpoint | Purpose | Access |
|---|---|---|---|
| GET | `/dashboard/admin` | Admin dashboard counts | Admin |
| GET | `/dashboard/merchant` | Merchant dashboard counts | Merchant |
| GET | `/dashboard/driver` | Driver dashboard counts | Driver |

Example admin dashboard response:

```json
{
  "total_orders": 1,
  "created_orders": 0,
  "assigned_orders": 0,
  "picked_up_orders": 0,
  "in_transit_orders": 0,
  "delivered_orders": 1,
  "failed_orders": 0,
  "cancelled_orders": 0,
  "returned_orders": 0,
  "active_merchants": 1,
  "active_drivers": 1,
  "available_drivers": 1
}
```

---

## 11. Completed Test Flow

The following full flow has been tested successfully:

```text
Admin seeded successfully
→ Admin logs in
→ Admin creates merchant user
→ Admin creates driver user
→ Admin creates merchant profile
→ Admin creates driver profile
→ Merchant logs in
→ Merchant creates order
→ Admin assigns order to driver
→ Driver logs in
→ Driver updates order status
→ Timeline records every event
→ Dashboards show updated counts
```

Example timeline output:

```json
[
  {
    "id": 1,
    "order_id": 1,
    "status": "created",
    "updated_by_user_id": 2,
    "notes": "Order created by merchant"
  },
  {
    "id": 2,
    "order_id": 1,
    "status": "assigned",
    "updated_by_user_id": 1,
    "notes": "Assigned to Demo Driver"
  },
  {
    "id": 3,
    "order_id": 1,
    "status": "picked_up",
    "updated_by_user_id": 3,
    "notes": "Package picked up"
  },
  {
    "id": 4,
    "order_id": 1,
    "status": "in_transit",
    "updated_by_user_id": 3,
    "notes": "Package is on the way"
  },
  {
    "id": 5,
    "order_id": 1,
    "status": "delivered",
    "updated_by_user_id": 3,
    "notes": "Package delivered successfully"
  }
]
```

---

## 12. Running the Backend

Start the backend server:

```powershell
python -m uvicorn app.main:app --reload
```

Open API docs:

```text
http://127.0.0.1:8000/docs
```

Health check:

```text
http://127.0.0.1:8000/health
```

Expected health response:

```json
{
  "status": "ok",
  "database": "connected"
}
```

---

## 13. Default Test Accounts

| Role | Email | Password |
|---|---|---|
| Admin | `admin@shipox.local` | `admin123` |
| Merchant | `merchant@shipox.local` | `merchant123` |
| Driver | `driver@shipox.local` | `driver123` |

---

## 14. Current Limitations

This is still a prototype backend. It does not yet include:

- Alembic migrations
- automated tests
- production logging
- refresh tokens
- password reset
- email/SMS notifications
- file uploads
- proof of delivery
- barcode/QR scanning
- map/location tracking
- route optimization
- pricing rules
- payment settlement
- invoices
- third-party courier integrations
- deployment configuration

---

## 15. Recommended Next Steps

Immediate next step:

```text
Start frontend development.
```

Recommended frontend direction:

```text
React Web Dashboard + React Native Mobile App + FastAPI Backend + PostgreSQL
```

Suggested next frontend order:

1. React project setup
2. API service layer
3. Login screen
4. Token storage
5. Role-based routing
6. Admin dashboard
7. Merchant dashboard
8. Driver dashboard
9. Merchant order creation
10. Admin order assignment
11. Driver status update
12. Order details and timeline page

Backend improvement tasks before client-level deployment:

1. Add Alembic migrations
2. Add proper error response format
3. Add pagination and search filters
4. Add automated tests
5. Add production CORS settings
6. Add environment-specific config
7. Add deployment files
8. Add logging
9. Add API versioning such as `/api/v1`
10. Add README and API documentation cleanup

---

## 16. Phase 1 Backend Verdict

The Phase 1 backend successfully demonstrates the central Shipox-style logistics workflow:

```text
Merchant order creation
Admin driver assignment
Driver delivery updates
Order tracking timeline
Role-based dashboards
```

This backend is now ready to be connected with a frontend.
