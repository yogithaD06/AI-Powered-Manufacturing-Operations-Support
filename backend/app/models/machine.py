from sqlalchemy import Column, Integer, String, Date, DateTime, ForeignKey
from sqlalchemy.sql import func

from app.core.database import Base


class Machine(Base):
    __tablename__ = "machines"

    machine_id = Column(Integer, primary_key=True, index=True)

    machine_code = Column(
        String(50),
        unique=True,
        nullable=False
    )

    machine_name = Column(String(100), nullable=False)
    machine_type = Column(String(100), nullable=True)

    line_id = Column(
        Integer,
        ForeignKey("production_lines.line_id"),
        nullable=False
    )

    department_id = Column(
        Integer,
        ForeignKey("departments.department_id"),
        nullable=False
    )

    location = Column(String(150), nullable=True)
    installation_date = Column(Date, nullable=True)
    status = Column(String(30), default="ACTIVE")

    created_at = Column(
        DateTime,
        server_default=func.now()
    )