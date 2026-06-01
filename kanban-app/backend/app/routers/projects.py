from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.services.project_service import ProjectService
from app.schemas.project import (
    ProjectCreate, ProjectUpdate, ProjectRead,
    ProjectMemberAdd, ProjectMemberRead, ProjectMemberRoleUpdate,
    ProjectMembersResponse,
)

router = APIRouter(prefix="/projects", tags=["projects"])


@router.post("/", response_model=ProjectRead, status_code=status.HTTP_201_CREATED)
async def create_project(
    data: ProjectCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await ProjectService(db).create(current_user.id, data)


@router.get("/", response_model=list[ProjectRead])
async def list_projects(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await ProjectService(db).list_for_user(current_user.id)


@router.get("/{project_id}", response_model=ProjectRead)
async def get_project(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await ProjectService(db).get(project_id, current_user.id)


@router.patch("/{project_id}", response_model=ProjectRead)
async def update_project(
    project_id: int,
    data: ProjectUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await ProjectService(db).update(project_id, current_user.id, data)


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await ProjectService(db).delete(project_id, current_user.id)


@router.get("/{project_id}/my-role")
async def get_my_role(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await ProjectService(db).get_my_role(project_id, current_user.id)


@router.get("/{project_id}/members", response_model=ProjectMembersResponse)
async def get_members(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await ProjectService(db).get_members(project_id, current_user.id)


@router.post("/{project_id}/members", response_model=ProjectMemberRead, status_code=status.HTTP_201_CREATED)
async def add_member(
    project_id: int,
    data: ProjectMemberAdd,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await ProjectService(db).add_member(project_id, current_user.id, data)


@router.patch("/{project_id}/members/{target_user_id}", response_model=ProjectMemberRead)
async def update_member_role(
    project_id: int,
    target_user_id: int,
    data: ProjectMemberRoleUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await ProjectService(db).update_member_role(project_id, current_user.id, target_user_id, data)


@router.delete("/{project_id}/members/{target_user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_member(
    project_id: int,
    target_user_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await ProjectService(db).remove_member(project_id, current_user.id, target_user_id)
