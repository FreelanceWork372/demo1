from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import Base, engine

from app.models import (
    User,
    Merchant,
    Driver,
    Order,
    OrderStatusHistory,
)

from app.routers import (
    auth_router,
    user_router,
    merchant_router,
    driver_router,
    order_router,
    dashboard_router,
)


Base.metadata.create_all(bind=engine)

app = FastAPI(title=settings.PROJECT_NAME)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(auth_router.router)
app.include_router(user_router.router)
app.include_router(merchant_router.router)
app.include_router(driver_router.router)
app.include_router(order_router.router)
app.include_router(dashboard_router.router)


@app.get("/")
def root():
    return {
        "message": "Shipox Prototype API is running"
    }


@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "database": "connected"
    }