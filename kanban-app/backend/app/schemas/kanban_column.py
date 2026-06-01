from pydantic import BaseModel, Field, ConfigDict


class KanbanColumnCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    order: int = 0
    color: str | None = None


class KanbanColumnUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    order: int | None = None
    color: str | None = None


class KanbanColumnRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    project_id: int
    name: str
    order: int
    color: str | None
