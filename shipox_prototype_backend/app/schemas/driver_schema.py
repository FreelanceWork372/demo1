from pydantic import BaseModel
from typing import Optional


class DriverCreate(BaseModel):
    user_id: int
    availability_status: Optional[str] = "available"


class DriverUpdate(BaseModel):
    availability_status: Optional[str] = None


class DriverResponse(BaseModel):
    id: int
    user_id: int
    availability_status: str

    class Config:
        from_attributes = True