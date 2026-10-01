from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.sql import func

from app.core.database import Base


class Department(Base):
    __tablename__ = "departments"

    department_id = Column(Integer, primary_key=True, index=True)

    department_name = Column(
        String(100),
        unique=True,
        nullable=False
    )

    description = Column(Text, nullable=True)

    location = Column(String(150), nullable=True)

    status = Column(
        String(20),
        default="ACTIVE"
    )

    created_at = Column(
        DateTime,
        server_default=func.now()
    )