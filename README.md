<div align="center">

<br />

<img src="https://img.shields.io/badge/KanbanApp-6366f1?style=for-the-badge&logo=trello&logoColor=white" alt="KanbanApp" height="40" />

<br /><br />

**Full-stack project management app with Kanban boards, WBS, and team collaboration.**

<br />

![React](https://img.shields.io/badge/React_19-20232a?style=flat-square&logo=react&logoColor=61dafb)
![TypeScript](https://img.shields.io/badge/TypeScript-3178c6?style=flat-square&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS_v4-0f172a?style=flat-square&logo=tailwindcss&logoColor=38bdf8)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=flat-square&logo=postgresql&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-22c55e?style=flat-square)

</div>

---

## Features

| | |
|---|---|
| **Kanban board** | Drag & drop tasks between columns, reordering, custom column colors |
| **WBS / EDT** | Phases → Work packages → Tasks, with estimated hours |
| **Project summary** | Progress ring, stats by column, priority and phase |
| **Team management** | Owner / Editor / Viewer roles, invite by email |
| **Filters** | Filter the board by priority and work package |
| **Due dates** | Visual badges: today, tomorrow, overdue |
| **Bilingual UI** | English / Spanish, persisted in localStorage |
| **Dark mode** | Light/dark toggle, respects system preference |
| **Responsive** | Mobile-first layout with touch drag support |
| **Export** | Download full project data as Excel (.xlsx) |

---

## Tech stack

### Frontend

| Technology | Purpose |
|---|---|
| React 19 + TypeScript | UI and component logic |
| Tailwind CSS v4 | Utility-first styling with class-based dark mode |
| @dnd-kit | Accessible drag & drop for the Kanban board |
| react-i18next | Internationalization EN / ES |
| React Router v7 | SPA navigation |
| Axios | HTTP client |
| xlsx | Excel export |

### Backend

| Technology | Purpose |
|---|---|
| FastAPI (Python 3.12+) | Async REST API |
| SQLAlchemy + asyncpg | Async ORM |
| Alembic | Database migrations |
| PostgreSQL | Relational database |
| JWT (python-jose) | Stateless authentication |
| passlib / bcrypt | Password hashing |

---

## Architecture

```
frontend/
├── src/
│   ├── pages/          # Full views (Dashboard, Project, EDT, ...)
│   ├── components/     # Reusable components and Kanban pieces
│   ├── contexts/       # Auth, Toast, Confirm, Theme, ProjectRole
│   ├── services/       # HTTP clients per domain
│   ├── types/          # Global TypeScript types
│   └── i18n/           # Translation files EN / ES

backend/
├── app/
│   ├── routers/        # HTTP endpoints + Pydantic validation
│   ├── services/       # Business logic
│   ├── repositories/   # Database access (Repository pattern)
│   ├── models/         # SQLAlchemy models
│   └── schemas/        # Pydantic input/output schemas
└── alembic/            # Migrations
```

**Backend pattern:** Router → Service → Repository.  
**Frontend pattern:** Pages → Components → Services → API.

---

## Database

```
users ──< project_members >── projects
                                  │
                              ┌───┴────────────┐
                           phases          kanban_columns
                              │                  │
                        work_packages ──────< tasks
```

The views `v_work_package_stats`, `v_phase_stats`, and `v_project_stats` always derive completion percentages and estimated hours upward from tasks — nothing is stored manually.

---

## Getting started

### Prerequisites

- Python 3.12+
- Node.js 18+
- PostgreSQL

### Backend

```bash
cd kanban-app/backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env            # fill in DATABASE_URL and SECRET_KEY
alembic upgrade head
uvicorn app.main:app --reload
```

API available at `http://localhost:8000`.  
Interactive docs: `http://localhost:8000/docs`

### Frontend

```bash
cd kanban-app/frontend
npm install
cp .env.example .env            # fill in VITE_API_URL
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

---

## License

[MIT](LICENSE)
