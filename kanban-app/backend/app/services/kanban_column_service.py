from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.kanban_column_repository import KanbanColumnRepository
from app.repositories.project_repository import ProjectRepository
from app.models.kanban_column import KanbanColumn
from app.models.project import MemberRole
from app.schemas.kanban_column import KanbanColumnCreate, KanbanColumnUpdate, KanbanColumnRead


class KanbanColumnService:
    def __init__(self, db: AsyncSession):
        self.repo = KanbanColumnRepository(db)
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

    async def _get_or_404(self, column_id: int) -> KanbanColumn:
        column = await self.repo.get_by_id(column_id)
        if not column:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Column not found")
        return column

    async def create(self, project_id: int, user_id: int, data: KanbanColumnCreate) -> KanbanColumnRead:
        await self._require_project_access(project_id, user_id, write=True)
        column = await self.repo.create(project_id=project_id, name=data.name, order=data.order)
        return KanbanColumnRead.model_validate(column)

    async def list_by_project(self, project_id: int, user_id: int) -> list[KanbanColumnRead]:
        await self._require_project_access(project_id, user_id)
        columns = await self.repo.get_by_project(project_id)
        return [KanbanColumnRead.model_validate(c) for c in columns]

    async def update(self, column_id: int, user_id: int, data: KanbanColumnUpdate) -> KanbanColumnRead:
        column = await self._get_or_404(column_id)
        await self._require_project_access(column.project_id, user_id, write=True)
        column = await self.repo.update(column, **data.model_dump(exclude_none=True))
        return KanbanColumnRead.model_validate(column)

    async def delete(self, column_id: int, user_id: int) -> None:
        column = await self._get_or_404(column_id)
        await self._require_project_access(column.project_id, user_id, write=True)
        await self.repo.delete(column)
