from pydantic import BaseModel, Field, ConfigDict


class WorkPackageCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    description: str | None = None
    acceptance_criteria: str | None = None
    order: int = 0


class WorkPackageUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = None
    acceptance_criteria: str | None = None
    order: int | None = None


class WorkPackageRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    phase_id: int
    name: str
    description: str | None
    acceptance_criteria: str | None
    order: int
