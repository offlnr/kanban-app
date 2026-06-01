from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.work_package_repository import WorkPackageRepository
from app.repositories.phase_repository import PhaseRepository
from app.repositories.project_repository import ProjectRepository
from app.models.work_package import WorkPackage
from app.models.project import MemberRole
from app.schemas.work_package import WorkPackageCreate, WorkPackageUpdate, WorkPackageRead


class WorkPackageService:
    def __init__(self, db: AsyncSession):
        self.repo = WorkPackageRepository(db)
        self.phase_repo = PhaseRepository(db)
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

    async def _get_or_404(self, wp_id: int) -> WorkPackage:
        wp = await self.repo.get_by_id(wp_id)
        if not wp:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Work package not found")
        return wp

    async def _get_project_id(self, phase_id: int) -> int:
        phase = await self.phase_repo.get_by_id(phase_id)
        if not phase:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Phase not found")
        return phase.project_id

    async def create(self, phase_id: int, user_id: int, data: WorkPackageCreate) -> WorkPackageRead:
        project_id = await self._get_project_id(phase_id)
        await self._require_project_access(project_id, user_id, write=True)
        wp = await self.repo.create(
            phase_id=phase_id,
            name=data.name,
            description=data.description,
            acceptance_criteria=data.acceptance_criteria,
            order=data.order,
        )
        return WorkPackageRead.model_validate(wp)

    async def list_by_phase(self, phase_id: int, user_id: int) -> list[WorkPackageRead]:
        project_id = await self._get_project_id(phase_id)
        await self._require_project_access(project_id, user_id)
        wps = await self.repo.get_by_phase(phase_id)
        return [WorkPackageRead.model_validate(wp) for wp in wps]

    async def update(self, wp_id: int, user_id: int, data: WorkPackageUpdate) -> WorkPackageRead:
        wp = await self._get_or_404(wp_id)
        project_id = await self._get_project_id(wp.phase_id)
        await self._require_project_access(project_id, user_id, write=True)
        wp = await self.repo.update(wp, **data.model_dump(exclude_none=True))
        return WorkPackageRead.model_validate(wp)

    async def delete(self, wp_id: int, user_id: int) -> None:
        wp = await self._get_or_404(wp_id)
        project_id = await self._get_project_id(wp.phase_id)
        await self._require_project_access(project_id, user_id, write=True)
        await self.repo.delete(wp)
