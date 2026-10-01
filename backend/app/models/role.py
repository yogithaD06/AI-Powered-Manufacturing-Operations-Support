from sqlalchemy import Column, Integer, String, Text, JSON, DateTime
from sqlalchemy.sql import func

from app.core.database import Base


class Role(Base):
    __tablename__ = "roles"

    role_id = Column(Integer, primary_key=True, index=True)
    role_name = Column(String(50), unique=True, nullable=False)
    role_description = Column(Text, nullable=True)
    permissions = Column(JSON, nullable=True)
    created_at = Column(DateTime, server_default=func.now())