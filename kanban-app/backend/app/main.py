from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Side-effect imports: register all models in Base.metadata for Alembic
from app.models import user, project, phase, work_package, kanban_column, task  # noqa: F401

from app.routers import auth, projects, phases, work_packages, kanban_columns, tasks, users
from app.core.config import settings

app = FastAPI(
    title="Kanban App API",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(projects.router)
app.include_router(phases.router)
app.include_router(work_packages.router)
app.include_router(kanban_columns.router)
app.include_router(tasks.router)
app.include_router(users.router)


@app.get("/health")
async def health():
    return {"status": "ok"}
