from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.repositories.project_repository import ProjectRepository
from app.repositories.user_repository import UserRepository
from app.models.project import Project, MemberRole
from app.schemas.project import (
    ProjectCreate, ProjectUpdate, ProjectRead,
    ProjectMemberAdd, ProjectMemberRead, ProjectMemberWithUser,
    ProjectMembersResponse, ProjectMemberRoleUpdate,
)
from app.schemas.user import UserRead


class ProjectService:
    def __init__(self, db: AsyncSession):
        self.repo = ProjectRepository(db)

    async def _get_or_404(self, project_id: int) -> Project:
        project = await self.repo.get_by_id(project_id)
        if not project:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
        return project

    async def _require_owner(self, project: Project, user_id: int) -> None:
        if project.owner_id != user_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the owner can perform this action")

    async def _require_access(self, project: Project, user_id: int, write: bool = False) -> None:
        if project.owner_id == user_id:
            return
        member = await self.repo.get_member(project.id, user_id)
        if not member:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
        if write and member.role == MemberRole.viewer:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")

    async def create(self, user_id: int, data: ProjectCreate) -> ProjectRead:
        project = await self.repo.create(owner_id=user_id, name=data.name, description=data.description)
        return ProjectRead.model_validate(project)

    async def list_for_user(self, user_id: int) -> list[ProjectRead]:
        projects = await self.repo.get_user_projects(user_id)
        return [ProjectRead.model_validate(p) for p in projects]

    async def get(self, project_id: int, user_id: int) -> ProjectRead:
        project = await self._get_or_404(project_id)
        await self._require_access(project, user_id)
        return ProjectRead.model_validate(project)

    async def update(self, project_id: int, user_id: int, data: ProjectUpdate) -> ProjectRead:
        project = await self._get_or_404(project_id)
        await self._require_owner(project, user_id)
        project = await self.repo.update(project, **data.model_dump(exclude_none=True))
        return ProjectRead.model_validate(project)

    async def delete(self, project_id: int, user_id: int) -> None:
        project = await self._get_or_404(project_id)
        await self._require_owner(project, user_id)
        await self.repo.delete(project)

    async def add_member(self, project_id: int, user_id: int, data: ProjectMemberAdd) -> ProjectMemberRead:
        project = await self._get_or_404(project_id)
        await self._require_owner(project, user_id)
        if await self.repo.get_member(project_id, data.user_id):
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="User is already a member")
        member = await self.repo.add_member(project_id, data.user_id, data.role)
        return ProjectMemberRead.model_validate(member)

    async def remove_member(self, project_id: int, user_id: int, target_user_id: int) -> None:
        project = await self._get_or_404(project_id)
        await self._require_owner(project, user_id)
        member = await self.repo.get_member(project_id, target_user_id)
        if not member:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found")
        await self.repo.remove_member(member)

    async def get_my_role(self, project_id: int, user_id: int) -> dict:
        project = await self._get_or_404(project_id)
        if project.owner_id == user_id:
            return {"role": "owner"}
        member = await self.repo.get_member(project_id, user_id)
        if not member:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
        return {"role": member.role.value}

    async def get_members(self, project_id: int, user_id: int) -> ProjectMembersResponse:
        project = await self._get_or_404(project_id)
        await self._require_access(project, user_id)

        user_repo = UserRepository(self.repo.db)
        owner = await user_repo.get_by_id(project.owner_id)

        members = await self.repo.get_members_with_users(project_id)

        # Determine current user's role
        if project.owner_id == user_id:
            current_role = "owner"
        else:
            m = await self.repo.get_member(project_id, user_id)
            current_role = m.role.value if m else "viewer"

        return ProjectMembersResponse(
            owner=UserRead.model_validate(owner),
            members=[ProjectMemberWithUser.model_validate(m) for m in members],
            current_user_role=current_role,
        )

    async def update_member_role(
        self, project_id: int, user_id: int, target_user_id: int, data: ProjectMemberRoleUpdate
    ) -> ProjectMemberRead:
        project = await self._get_or_404(project_id)
        await self._require_owner(project, user_id)
        if target_user_id == project.owner_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot change the owner's role")
        member = await self.repo.get_member(project_id, target_user_id)
        if not member:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found")
        updated = await self.repo.update_member_role(member, data.role)
        return ProjectMemberRead.model_validate(updated)
