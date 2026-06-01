from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.services.work_package_service import WorkPackageService
from app.schemas.work_package import WorkPackageCreate, WorkPackageUpdate, WorkPackageRead

router = APIRouter(tags=["work-packages"])


@router.post("/phases/{phase_id}/work-packages", response_model=WorkPackageRead, status_code=status.HTTP_201_CREATED)
async def create_work_package(
    phase_id: int,
    data: WorkPackageCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await WorkPackageService(db).create(phase_id, current_user.id, data)


@router.get("/phases/{phase_id}/work-packages", response_model=list[WorkPackageRead])
async def list_work_packages(
    phase_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await WorkPackageService(db).list_by_phase(phase_id, current_user.id)


@router.patch("/work-packages/{wp_id}", response_model=WorkPackageRead)
async def update_work_package(
    wp_id: int,
    data: WorkPackageUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await WorkPackageService(db).update(wp_id, current_user.id, data)


@router.delete("/work-packages/{wp_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_work_package(
    wp_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await WorkPackageService(db).delete(wp_id, current_user.id)
