# KanbanApp

A full-stack project management application built with a Kanban-style task board. Designed to demonstrate clean architecture, separation of concerns, and ISO/IEC 9126 quality metrics (maintainability, usability).

## Features

- **Kanban board** — drag-and-drop tasks between columns with priority sorting and column reordering
- **Work Breakdown Structure (WBS/EDT)** — organize work into phases and work packages
- **Task management** — priority levels, estimated hours, due dates with visual overdue indicators
- **Project summary** — progress ring, per-column/priority/phase stats, hours breakdown
- **Team members** — role-based access (Owner / Editor / Viewer)
- **Filters** — filter board by priority and work package
- **Bilingual UI** — English / Spanish toggle (persisted in localStorage)
- **Responsive** — mobile-first layout with touch drag support

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Tailwind CSS v4, @dnd-kit, react-i18next |
| Backend | FastAPI (Python 3.14), SQLAlchemy async, Alembic |
| Database | PostgreSQL |
| Auth | JWT (python-jose), passlib/bcrypt |

## Architecture

**Backend:** Router → Service → Repository pattern. Routers handle HTTP and Pydantic validation; services contain business logic; repositories own all database access.

**Frontend:** Pages → Components → Hooks → Services. Context providers for auth, toasts, confirm dialogs, and project role.

## Getting started

### Prerequisites

- Python 3.12+
- Node.js 18+
- PostgreSQL

### Backend

```bash
cd kanban-app/backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env      # fill in your DATABASE_URL and SECRET_KEY
alembic upgrade head
uvicorn app.main:app --reload
```

### Frontend

```bash
cd kanban-app/frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Database schema

Core tables: `users`, `projects`, `project_members`, `phases`, `work_packages`, `kanban_columns`, `tasks`

Calculated views: `v_work_package_stats`, `v_phase_stats`, `v_project_stats` — completion percentages and estimated hours are always derived from tasks upward; never stored manually.

## License

MIT
