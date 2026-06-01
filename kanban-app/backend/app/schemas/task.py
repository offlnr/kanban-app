from datetime import datetime, date
from pydantic import BaseModel, Field, ConfigDict
from app.models.task import TaskPriority


class TaskCreate(BaseModel):
    work_package_id: int
    column_id: int
    title: str = Field(min_length=1, max_length=255)
    description: str | None = None
    priority: TaskPriority = TaskPriority.medium
    estimated_hours: float | None = Field(default=None, ge=0)
    assigned_to: int | None = None
    due_date: date | None = None
    order: int = 0


class TaskUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = None
    priority: TaskPriority | None = None
    estimated_hours: float | None = Field(default=None, ge=0)
    assigned_to: int | None = None
    due_date: date | None = None
    column_id: int | None = None
    order: int | None = None


class TaskRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    work_package_id: int
    column_id: int
    title: str
    description: str | None
    priority: TaskPriority
    estimated_hours: float | None
    assigned_to: int | None
    due_date: date | None
    order: int
    created_at: datetime
    updated_at: datetime
