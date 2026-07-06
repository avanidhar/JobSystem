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

## Known tradeoffs

**Job list pagination is offset-based (`page`/`page_size`), not cursor-based.**
`GET /api/jobs/` uses DRF's `PageNumberPagination` (`backend/jobs/pagination.py`):
the server computes `LIMIT`/`OFFSET` fresh from `page` and `page_size` on every
request and keeps no state between requests — no continuation token.

This is a deliberate choice for now, not an oversight, but it has a real
limitation at scale: because each page is recomputed from current data rather
than a stable snapshot, results can drift if rows are added or removed between
page loads. With thousands of jobs and multiple concurrent users actively
creating/updating/deleting jobs, a user paging through the list can see a row
twice or skip one entirely if the underlying data shifts underneath them
mid-session. Cursor-based pagination (DRF's `CursorPagination`, keyed off e.g.
`created_at` + `id`) is immune to this class of bug, since each page is
anchored to the last row actually seen rather than a numeric offset.

We're accepting this tradeoff for the current single-team-scale usage pattern.
Revisit if/when this needs to support many concurrent users against a
large, actively-changing job list.
