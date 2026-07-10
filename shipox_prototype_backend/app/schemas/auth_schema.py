from pydantic import BaseModel

class LoginRequest(BaseModel):
    email: str
    password: str


class UserInfo(BaseModel):
    id: int
    name: str
    email: str
    role: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserInfo


class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    phone: str
    role: str
    # Optional merchant fields
    business_name: str | None = None
    contact_person: str | None = None
    pickup_address: str | None = None