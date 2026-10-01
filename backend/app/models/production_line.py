from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.sql import func

from app.core.database import Base


class ProductionLine(Base):
    __tablename__ = "production_lines"

    line_id = Column(Integer, primary_key=True, index=True)
    line_name = Column(String(100), nullable=False)

    department_id = Column(
        Integer,
        ForeignKey("departments.department_id"),
        nullable=False
    )

    location = Column(String(150), nullable=True)
    status = Column(String(20), default="ACTIVE")

    created_at = Column(
        DateTime,
        server_default=func.now()
    )