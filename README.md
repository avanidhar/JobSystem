# JobSystem

Django + PostgreSQL backend, React + TypeScript frontend, each running in its own Docker container.

## Structure

- `backend/` — Django REST API (see `backend/.env.example` for config)
- `frontend/` — React + TypeScript app built with Vite (see `frontend/.env.example` for config)
- `docker-compose.yml` — wires up `db`, `backend`, and `frontend` services

## Running locally

```bash
docker compose up --build
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000/api/health/
- Django admin: http://localhost:8000/admin/
- Postgres: localhost:5432

The first run applies migrations automatically. To create an admin user:

```bash
docker compose exec backend python manage.py createsuperuser
```

Both `backend/` and `frontend/` are mounted as volumes, so code changes hot-reload without rebuilding the image.
