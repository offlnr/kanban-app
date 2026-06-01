from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.phase_repository import PhaseRepository
from app.repositories.project_repository import ProjectRepository
from app.models.phase import Phase
from app.models.project import MemberRole
from app.schemas.phase import PhaseCreate, PhaseUpdate, PhaseRead


class PhaseService:
    def __init__(self, db: AsyncSession):
        self.repo = PhaseRepository(db)
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

    async def _get_or_404(self, phase_id: int) -> Phase:
        phase = await self.repo.get_by_id(phase_id)
        if not phase:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Phase not found")
        return phase

    async def create(self, project_id: int, user_id: int, data: PhaseCreate) -> PhaseRead:
        await self._require_project_access(project_id, user_id, write=True)
        phase = await self.repo.create(
            project_id=project_id, name=data.name, description=data.description, order=data.order
        )
        return PhaseRead.model_validate(phase)

    async def list_by_project(self, project_id: int, user_id: int) -> list[PhaseRead]:
        await self._require_project_access(project_id, user_id)
        phases = await self.repo.get_by_project(project_id)
        return [PhaseRead.model_validate(p) for p in phases]

    async def update(self, phase_id: int, user_id: int, data: PhaseUpdate) -> PhaseRead:
        phase = await self._get_or_404(phase_id)
        await self._require_project_access(phase.project_id, user_id, write=True)
        phase = await self.repo.update(phase, **data.model_dump(exclude_none=True))
        return PhaseRead.model_validate(phase)

    async def delete(self, phase_id: int, user_id: int) -> None:
        phase = await self._get_or_404(phase_id)
        await self._require_project_access(phase.project_id, user_id, write=True)
        await self.repo.delete(phase)
