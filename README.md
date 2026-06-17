<div align="center">

<br />

<img src="https://img.shields.io/badge/KanbanApp-6366f1?style=for-the-badge&logo=trello&logoColor=white" alt="KanbanApp" height="40" />

<br /><br />

**Gestión de proyectos full-stack con tablero Kanban, EDT y colaboración en equipo.**

<br />

![React](https://img.shields.io/badge/React_19-20232a?style=flat-square&logo=react&logoColor=61dafb)
![TypeScript](https://img.shields.io/badge/TypeScript-3178c6?style=flat-square&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS_v4-0f172a?style=flat-square&logo=tailwindcss&logoColor=38bdf8)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=flat-square&logo=postgresql&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-22c55e?style=flat-square)

</div>

---

## Características

| | |
|---|---|
| 🗂 **Tablero Kanban** | Drag & drop entre columnas, reordenamiento, colores personalizados |
| 🏗 **EDT / WBS** | Fases → Paquetes de trabajo → Tareas, con horas estimadas |
| 📊 **Resumen del proyecto** | Ring de progreso, estadísticas por columna, prioridad y fase |
| 👥 **Gestión de equipo** | Roles Owner / Editor / Viewer, invitación por email |
| 🔍 **Filtros** | Filtrar el tablero por prioridad y paquete de trabajo |
| 📅 **Fechas límite** | Badges visuales: hoy, mañana, vencida |
| 🌐 **Bilingüe** | Español / English, persistido en localStorage |
| 🌙 **Modo oscuro** | Toggle claro/oscuro, detecta preferencia del sistema |
| 📱 **Responsivo** | Layout mobile-first con soporte de drag táctil |
| 📤 **Exportar** | Descarga el proyecto a Excel (.xlsx) |

---

## Stack tecnológico

### Frontend

| Tecnología | Uso |
|---|---|
| React 19 + TypeScript | UI y lógica de componentes |
| Tailwind CSS v4 | Estilos utilitarios con modo oscuro por clase |
| @dnd-kit | Drag & drop accesible del tablero Kanban |
| react-i18next | Internacionalización ES / EN |
| React Router v7 | Navegación SPA |
| Axios | Comunicación con la API |
| xlsx | Exportación a Excel |

### Backend

| Tecnología | Uso |
|---|---|
| FastAPI (Python 3.12+) | API REST asíncrona |
| SQLAlchemy + asyncpg | ORM asíncrono |
| Alembic | Migraciones de base de datos |
| PostgreSQL | Base de datos relacional |
| JWT (python-jose) | Autenticación stateless |
| passlib / bcrypt | Hashing de contraseñas |

---

## Arquitectura

```
frontend/
├── src/
│   ├── pages/          # Vistas completas (Dashboard, Project, EDT, …)
│   ├── components/     # Componentes reutilizables y Kanban
│   ├── contexts/       # Auth, Toast, Confirm, Theme, ProjectRole
│   ├── services/       # Clientes HTTP por dominio
│   ├── types/          # Tipos TypeScript globales
│   └── i18n/           # Archivos de traducción ES / EN

backend/
├── app/
│   ├── routers/        # Endpoints HTTP + validación Pydantic
│   ├── services/       # Lógica de negocio
│   ├── repositories/   # Acceso a base de datos (patrón Repository)
│   ├── models/         # Modelos SQLAlchemy
│   └── schemas/        # Esquemas Pydantic de entrada/salida
└── alembic/            # Migraciones
```

**Patrón backend:** Router → Service → Repository.  
**Patrón frontend:** Pages → Components → Services → API.

---

## Base de datos

```
users ──< project_members >── projects
                                  │
                              ┌───┴────────────┐
                           phases          kanban_columns
                              │                  │
                        work_packages ──────< tasks
```

Las vistas `v_work_package_stats`, `v_phase_stats` y `v_project_stats` calculan porcentajes de completitud y horas siempre desde las tareas hacia arriba — nunca se almacenan manualmente.

---

## Inicio rápido

### Requisitos previos

- Python 3.12+
- Node.js 18+
- PostgreSQL

### Backend

```bash
cd kanban-app/backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env            # completar DATABASE_URL y SECRET_KEY
alembic upgrade head
uvicorn app.main:app --reload
```

La API queda disponible en `http://localhost:8000`.  
Documentación interactiva: `http://localhost:8000/docs`

### Frontend

```bash
cd kanban-app/frontend
npm install
cp .env.example .env            # completar VITE_API_URL
npm run dev
```

Abrir [http://localhost:5173](http://localhost:5173).

---

## Licencia

[MIT](LICENSE)
