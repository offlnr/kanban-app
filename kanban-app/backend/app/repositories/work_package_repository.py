from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.work_package import WorkPackage


class WorkPackageRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(
        self,
        phase_id: int,
        name: str,
        description: str | None,
        acceptance_criteria: str | None,
        order: int,
    ) -> WorkPackage:
        wp = WorkPackage(
            phase_id=phase_id,
            name=name,
            description=description,
            acceptance_criteria=acceptance_criteria,
            order=order,
        )
        self.db.add(wp)
        await self.db.commit()
        await self.db.refresh(wp)
        return wp

    async def get_by_id(self, wp_id: int) -> WorkPackage | None:
        result = await self.db.execute(select(WorkPackage).where(WorkPackage.id == wp_id))
        return result.scalar_one_or_none()

    async def get_by_phase(self, phase_id: int) -> list[WorkPackage]:
        result = await self.db.execute(
            select(WorkPackage).where(WorkPackage.phase_id == phase_id).order_by(WorkPackage.order)
        )
        return list(result.scalars().all())

    async def update(self, wp: WorkPackage, **kwargs) -> WorkPackage:
        for key, value in kwargs.items():
            setattr(wp, key, value)
        await self.db.commit()
        await self.db.refresh(wp)
        return wp

    async def delete(self, wp: WorkPackage) -> None:
        await self.db.delete(wp)
        await self.db.commit()
