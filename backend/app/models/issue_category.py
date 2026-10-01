from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.sql import func

from app.core.database import Base


class IssueCategory(Base):
    __tablename__ = "issue_categories"

    category_id = Column(Integer, primary_key=True, index=True)

    category_name = Column(
        String(100),
        nullable=False
    )

    subcategory_name = Column(String(100), nullable=True)
    description = Column(Text, nullable=True)
    severity_level = Column(String(20), nullable=True)
    status = Column(String(20), default="ACTIVE")

    created_at = Column(
        DateTime,
        server_default=func.now()
    )