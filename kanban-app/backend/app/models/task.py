import enum
from datetime import date
from sqlalchemy import String, ForeignKey, Text, Integer, Numeric, DateTime, Date, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from app.database import Base


class TaskPriority(enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"
    critical = "critical"


class Task(Base):
    __tablename__ = "tasks"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    work_package_id: Mapped[int] = mapped_column(ForeignKey("work_packages.id"), nullable=False)
    column_id: Mapped[int] = mapped_column(ForeignKey("kanban_columns.id"), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    priority: Mapped[TaskPriority] = mapped_column(Enum(TaskPriority), nullable=False, default=TaskPriority.medium)
    estimated_hours: Mapped[float] = mapped_column(Numeric(6, 2), nullable=True)
    assigned_to: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=True)
    due_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    work_package: Mapped["WorkPackage"] = relationship("WorkPackage", back_populates="tasks")
    column: Mapped["KanbanColumn"] = relationship("KanbanColumn", back_populates="tasks")
    assigned_user: Mapped["User"] = relationship("User", back_populates="assigned_tasks")
