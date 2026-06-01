from datetime import date
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.task import Task, TaskPriority
from app.models.kanban_column import KanbanColumn


class TaskRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(
        self,
        work_package_id: int,
        column_id: int,
        title: str,
        description: str | None,
        priority: TaskPriority,
        estimated_hours: float | None,
        assigned_to: int | None,
        due_date: date | None,
        order: int,
    ) -> Task:
        task = Task(
            work_package_id=work_package_id,
            column_id=column_id,
            title=title,
            description=description,
            priority=priority,
            estimated_hours=estimated_hours,
            assigned_to=assigned_to,
            due_date=due_date,
            order=order,
        )
        self.db.add(task)
        await self.db.commit()
        await self.db.refresh(task)
        return task

    async def get_by_id(self, task_id: int) -> Task | None:
        result = await self.db.execute(select(Task).where(Task.id == task_id))
        return result.scalar_one_or_none()

    async def get_by_project(self, project_id: int) -> list[Task]:
        result = await self.db.execute(
            select(Task)
            .join(KanbanColumn, Task.column_id == KanbanColumn.id)
            .where(KanbanColumn.project_id == project_id)
            .order_by(KanbanColumn.order, Task.order)
        )
        return list(result.scalars().all())

    async def update(self, task: Task, **kwargs) -> Task:
        for key, value in kwargs.items():
            setattr(task, key, value)
        await self.db.commit()
        await self.db.refresh(task)
        return task

    async def delete(self, task: Task) -> None:
        await self.db.delete(task)
        await self.db.commit()
