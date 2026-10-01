from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.sql import func

from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    user_id = Column(Integer, primary_key=True, index=True)

    employee_id = Column(
        String(50),
        unique=True,
        nullable=False
    )

    name = Column(String(100), nullable=False)

    email = Column(
        String(150),
        unique=True,
        nullable=False
    )

    password_hash = Column(Text, nullable=False)

    role_id = Column(
        Integer,
        ForeignKey("roles.role_id"),
        nullable=False
    )

    department_id = Column(
        Integer,
        ForeignKey("departments.department_id"),
        nullable=True
    )

    account_status = Column(
        String(20),
        default="ACTIVE"
    )

    created_at = Column(
        DateTime,
        server_default=func.now()
    )

    last_login = Column(DateTime, nullable=True)