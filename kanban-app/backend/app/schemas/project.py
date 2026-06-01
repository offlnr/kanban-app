from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict
from app.models.project import MemberRole
from app.schemas.user import UserRead


class ProjectCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    description: str | None = None


class ProjectUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = None


class ProjectRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    description: str | None
    owner_id: int
    created_at: datetime


class ProjectMemberAdd(BaseModel):
    user_id: int
    role: MemberRole


class ProjectMemberRoleUpdate(BaseModel):
    role: MemberRole


class ProjectMemberRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    project_id: int
    user_id: int
    role: MemberRole


class ProjectMemberWithUser(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    project_id: int
    user_id: int
    role: MemberRole
    user: UserRead


class ProjectMembersResponse(BaseModel):
    owner: UserRead
    members: list[ProjectMemberWithUser]
    current_user_role: str
