from app.database import SessionLocal, Base, engine
from app.models.user import User, UserRole
from app.models.merchant import Merchant
from app.models.driver import Driver, DriverAvailability
from app.core.security import hash_password


def seed_admin():
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()

    # 1. Create Admin
    existing_admin = db.query(User).filter(User.email == "admin@shipox.local").first()
    if not existing_admin:
        admin = User(
            name="System Admin",
            email="admin@shipox.local",
            password_hash=hash_password("admin123"),
            phone="0000000000",
            role=UserRole.admin,
            is_active=True
        )
        db.add(admin)
        db.commit()
        print("Admin user created successfully.")
    else:
        print("Admin user already exists.")

    # 2. Create Merchant
    existing_merchant = db.query(User).filter(User.email == "merchant@shipox.local").first()
    if not existing_merchant:
        merchant_user = User(
            name="Demo Merchant",
            email="merchant@shipox.local",
            password_hash=hash_password("merchant123"),
            phone="1111111111",
            role=UserRole.merchant,
            is_active=True
        )
        db.add(merchant_user)
        db.commit()
        db.refresh(merchant_user)
        
        merchant_profile = Merchant(
            user_id=merchant_user.id,
            business_name="Shipox Demo Store",
            contact_person="John Doe",
            pickup_address="123 Commerce St, Tech City"
        )
        db.add(merchant_profile)
        db.commit()
        print("Merchant user created successfully.")
    else:
        print("Merchant user already exists.")

    # 3. Create Driver
    existing_driver = db.query(User).filter(User.email == "driver@shipox.local").first()
    if not existing_driver:
        driver_user = User(
            name="Demo Driver",
            email="driver@shipox.local",
            password_hash=hash_password("driver123"),
            phone="2222222222",
            role=UserRole.driver,
            is_active=True
        )
        db.add(driver_user)
        db.commit()
        db.refresh(driver_user)
        
        driver_profile = Driver(
            user_id=driver_user.id,
            availability_status=DriverAvailability.available
        )
        db.add(driver_profile)
        db.commit()
        print("Driver user created successfully.")
    else:
        print("Driver user already exists.")

    db.close()


if __name__ == "__main__":
    seed_admin()