from pydantic import BaseModel
from typing import Optional


class MerchantCreate(BaseModel):
    user_id: int
    business_name: str
    contact_person: str
    pickup_address: str


class MerchantUpdate(BaseModel):
    business_name: Optional[str] = None
    contact_person: Optional[str] = None
    pickup_address: Optional[str] = None


class MerchantResponse(BaseModel):
    id: int
    user_id: int
    business_name: str
    contact_person: str
    pickup_address: str

    class Config:
        from_attributes = True