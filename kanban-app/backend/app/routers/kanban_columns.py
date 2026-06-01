from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.services.kanban_column_service import KanbanColumnService
from app.schemas.kanban_column import KanbanColumnCreate, KanbanColumnUpdate, KanbanColumnRead

router = APIRouter(tags=["kanban-columns"])


@router.post("/projects/{project_id}/columns", response_model=KanbanColumnRead, status_code=status.HTTP_201_CREATED)
async def create_column(
    project_id: int,
    data: KanbanColumnCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await KanbanColumnService(db).create(project_id, current_user.id, data)


@router.get("/projects/{project_id}/columns", response_model=list[KanbanColumnRead])
async def list_columns(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await KanbanColumnService(db).list_by_project(project_id, current_user.id)


@router.patch("/columns/{column_id}", response_model=KanbanColumnRead)
async def update_column(
    column_id: int,
    data: KanbanColumnUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await KanbanColumnService(db).update(column_id, current_user.id, data)


@router.delete("/columns/{column_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_column(
    column_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await KanbanColumnService(db).delete(column_id, current_user.id)
