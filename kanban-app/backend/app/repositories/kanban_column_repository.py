from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.kanban_column import KanbanColumn


class KanbanColumnRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, project_id: int, name: str, order: int) -> KanbanColumn:
        column = KanbanColumn(project_id=project_id, name=name, order=order)
        self.db.add(column)
        await self.db.commit()
        await self.db.refresh(column)
        return column

    async def get_by_id(self, column_id: int) -> KanbanColumn | None:
        result = await self.db.execute(select(KanbanColumn).where(KanbanColumn.id == column_id))
        return result.scalar_one_or_none()

    async def get_by_project(self, project_id: int) -> list[KanbanColumn]:
        result = await self.db.execute(
            select(KanbanColumn)
            .where(KanbanColumn.project_id == project_id)
            .order_by(KanbanColumn.order)
        )
        return list(result.scalars().all())

    async def update(self, column: KanbanColumn, **kwargs) -> KanbanColumn:
        for key, value in kwargs.items():
            setattr(column, key, value)
        await self.db.commit()
        await self.db.refresh(column)
        return column

    async def delete(self, column: KanbanColumn) -> None:
        await self.db.delete(column)
        await self.db.commit()
