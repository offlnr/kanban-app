from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.task_repository import TaskRepository
from app.repositories.kanban_column_repository import KanbanColumnRepository
from app.repositories.project_repository import ProjectRepository
from app.models.task import Task
from app.models.project import MemberRole
from app.schemas.task import TaskCreate, TaskUpdate, TaskRead


class TaskService:
    def __init__(self, db: AsyncSession):
        self.repo = TaskRepository(db)
        self.col_repo = KanbanColumnRepository(db)
        self.proj_repo = ProjectRepository(db)

    async def _require_project_access(self, project_id: int, user_id: int, write: bool = False) -> None:
        project = await self.proj_repo.get_by_id(project_id)
        if not project:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
        if project.owner_id == user_id:
            return
        member = await self.proj_repo.get_member(project_id, user_id)
        if not member:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
        if write and member.role == MemberRole.viewer:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")

    async def _get_or_404(self, task_id: int) -> Task:
        task = await self.repo.get_by_id(task_id)
        if not task:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
        return task

    async def _get_project_id_from_column(self, column_id: int) -> int:
        column = await self.col_repo.get_by_id(column_id)
        if not column:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Column not found")
        return column.project_id

    async def create(self, user_id: int, data: TaskCreate) -> TaskRead:
        project_id = await self._get_project_id_from_column(data.column_id)
        await self._require_project_access(project_id, user_id, write=True)
        task = await self.repo.create(
            work_package_id=data.work_package_id,
            column_id=data.column_id,
            title=data.title,
            description=data.description,
            priority=data.priority,
            estimated_hours=data.estimated_hours,
            assigned_to=data.assigned_to,
            due_date=data.due_date,
            order=data.order,
        )
        return TaskRead.model_validate(task)

    async def list_by_project(self, project_id: int, user_id: int) -> list[TaskRead]:
        await self._require_project_access(project_id, user_id)
        tasks = await self.repo.get_by_project(project_id)
        return [TaskRead.model_validate(t) for t in tasks]

    async def update(self, task_id: int, user_id: int, data: TaskUpdate) -> TaskRead:
        task = await self._get_or_404(task_id)
        project_id = await self._get_project_id_from_column(task.column_id)
        await self._require_project_access(project_id, user_id, write=True)
        task = await self.repo.update(task, **data.model_dump(exclude_unset=True))
        return TaskRead.model_validate(task)

    async def delete(self, task_id: int, user_id: int) -> None:
        task = await self._get_or_404(task_id)
        project_id = await self._get_project_id_from_column(task.column_id)
        await self._require_project_access(project_id, user_id, write=True)
        await self.repo.delete(task)
