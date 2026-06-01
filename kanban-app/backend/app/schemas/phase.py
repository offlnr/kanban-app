from pydantic import BaseModel, Field, ConfigDict


class PhaseCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    description: str | None = None
    order: int = 0


class PhaseUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = None
    order: int | None = None


class PhaseRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    project_id: int
    name: str
    description: str | None
    order: int
