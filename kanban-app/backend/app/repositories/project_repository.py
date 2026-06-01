from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from sqlalchemy.orm import selectinload
from app.models.project import Project, ProjectMember, MemberRole


class ProjectRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, owner_id: int, name: str, description: str | None) -> Project:
        project = Project(owner_id=owner_id, name=name, description=description)
        self.db.add(project)
        await self.db.commit()
        await self.db.refresh(project)
        return project

    async def get_by_id(self, project_id: int) -> Project | None:
        result = await self.db.execute(select(Project).where(Project.id == project_id))
        return result.scalar_one_or_none()

    async def get_user_projects(self, user_id: int) -> list[Project]:
        owned = select(Project.id).where(Project.owner_id == user_id)
        member_of = select(ProjectMember.project_id).where(ProjectMember.user_id == user_id)
        result = await self.db.execute(
            select(Project).where(or_(Project.id.in_(owned), Project.id.in_(member_of)))
        )
        return list(result.scalars().all())

    async def update(self, project: Project, **kwargs) -> Project:
        for key, value in kwargs.items():
            setattr(project, key, value)
        await self.db.commit()
        await self.db.refresh(project)
        return project

    async def delete(self, project: Project) -> None:
        await self.db.delete(project)
        await self.db.commit()

    async def get_member(self, project_id: int, user_id: int) -> ProjectMember | None:
        result = await self.db.execute(
            select(ProjectMember).where(
                ProjectMember.project_id == project_id,
                ProjectMember.user_id == user_id,
            )
        )
        return result.scalar_one_or_none()

    async def add_member(self, project_id: int, user_id: int, role: MemberRole) -> ProjectMember:
        member = ProjectMember(project_id=project_id, user_id=user_id, role=role)
        self.db.add(member)
        await self.db.commit()
        await self.db.refresh(member)
        return member

    async def remove_member(self, member: ProjectMember) -> None:
        await self.db.delete(member)
        await self.db.commit()

    async def get_members_with_users(self, project_id: int) -> list[ProjectMember]:
        result = await self.db.execute(
            select(ProjectMember)
            .options(selectinload(ProjectMember.user))
            .where(ProjectMember.project_id == project_id)
        )
        return list(result.scalars().all())

    async def update_member_role(self, member: ProjectMember, role: MemberRole) -> ProjectMember:
        member.role = role
        await self.db.commit()
        await self.db.refresh(member)
        return member
