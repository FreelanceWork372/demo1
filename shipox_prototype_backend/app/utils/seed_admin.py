from app.database import SessionLocal, Base, engine
from app.models.user import User, UserRole
from app.core.security import hash_password


def seed_admin():
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()

    existing_admin = db.query(User).filter(
        User.email == "admin@shipox.local"
    ).first()

    if existing_admin:
        print("Admin user already exists.")
        db.close()
        return

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
    db.close()

    print("Admin user created successfully.")
    print("Email: admin@shipox.local")
    print("Password: admin123")


if __name__ == "__main__":
    seed_admin()