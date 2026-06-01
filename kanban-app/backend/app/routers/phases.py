from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.services.phase_service import PhaseService
from app.schemas.phase import PhaseCreate, PhaseUpdate, PhaseRead

router = APIRouter(tags=["phases"])


@router.post("/projects/{project_id}/phases", response_model=PhaseRead, status_code=status.HTTP_201_CREATED)
async def create_phase(
    project_id: int,
    data: PhaseCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await PhaseService(db).create(project_id, current_user.id, data)


@router.get("/projects/{project_id}/phases", response_model=list[PhaseRead])
async def list_phases(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await PhaseService(db).list_by_project(project_id, current_user.id)


@router.patch("/phases/{phase_id}", response_model=PhaseRead)
async def update_phase(
    phase_id: int,
    data: PhaseUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await PhaseService(db).update(phase_id, current_user.id, data)


@router.delete("/phases/{phase_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_phase(
    phase_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await PhaseService(db).delete(phase_id, current_user.id)
