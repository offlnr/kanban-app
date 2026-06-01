from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.phase import Phase


class PhaseRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, project_id: int, name: str, description: str | None, order: int) -> Phase:
        phase = Phase(project_id=project_id, name=name, description=description, order=order)
        self.db.add(phase)
        await self.db.commit()
        await self.db.refresh(phase)
        return phase

    async def get_by_id(self, phase_id: int) -> Phase | None:
        result = await self.db.execute(select(Phase).where(Phase.id == phase_id))
        return result.scalar_one_or_none()

    async def get_by_project(self, project_id: int) -> list[Phase]:
        result = await self.db.execute(
            select(Phase).where(Phase.project_id == project_id).order_by(Phase.order)
        )
        return list(result.scalars().all())

    async def update(self, phase: Phase, **kwargs) -> Phase:
        for key, value in kwargs.items():
            setattr(phase, key, value)
        await self.db.commit()
        await self.db.refresh(phase)
        return phase

    async def delete(self, phase: Phase) -> None:
        await self.db.delete(phase)
        await self.db.commit()
