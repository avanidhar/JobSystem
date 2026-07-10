# JobSystem

Django + PostgreSQL backend, React + TypeScript frontend, each running in its own Docker container.

## Time
Wall clock - 3 days
CPU time - roughly 2.5 hours

## AI Use
Session transcript can be found in the `session-transcript.txt` file in the repository

## Structure

- `backend/` — Django REST API (see `backend/.env.example` for config). Unit tests are in `backend/jobs/tests`
- `frontend/` — React + TypeScript app built with Vite (see `frontend/.env.example` for config). Playwright tests are in `frontend/e2e`
- `docker-compose.yml` — wires up `db`, `backend`, and `frontend` services

## Running locally

A `Makefile` wraps the common commands:

| Target | Does |
|---|---|
| `make build` | Builds the `backend`/`frontend` images (`docker compose build`) |
| `make up` | Starts `db`, `backend`, `frontend` in the background |
| `make test` | Ensures the app is up, then runs the Playwright e2e suite |
| `make stop` | Stops containers, but keeps them + volumes for a quick restart |
| `make clean` | Full wipe: removes containers, the network, **and the Postgres volume** |

Or run the underlying commands directly:

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

To generate some dummy data to look at in the UI:

```bash
docker compose exec backend python manage.py seed_jobs
```

Replaces all jobs with a fixed set of 15 dummy jobs (see
`backend/jobs/management/commands/seed_jobs.py`), each walking through a
realistic status history rather than just a final status, spread across all
four statuses (Pending/Running/Succeeded/Failed) for exercising the UI.

## Running backend tests

```bash
docker compose run --rm --no-deps backend python manage.py test jobs -v 2
```

Tests run against an in-memory SQLite database (see `RUNNING_TESTS` in
`backend/config/settings.py`), not Postgres, so no `db` container is needed —
the full suite runs in well under a second. 
Make sure you run with `--no-deps` here: without it, `docker compose run` still honors 
`depends_on` in `docker-compose.yml` and starts the `db`, even though the tests themselves 
no longer depend on it.

### Running tests without Docker

Since tests use SQLite rather than Postgres, they can also run in a plain
local virtualenv without requiring any containers. Django 5.0 requires **Python
≥3.10**; check `python3 --version` first, since some machines default to an
older interpreter (e.g. via conda) even when a newer one is installed
alongside it. Then, you can run the tests in a virtual environment as shown below

```bash
cd backend
python3.12 -m venv .venv   # use any local Python >=3.10
source .venv/bin/activate
pip install -r requirements.txt
python manage.py test jobs -v 2
```

If `psycopg2-binary` fails to build (no prebuilt wheel for your Python
version, and no local `pg_config` to build it from source), it's safe to skip
for testing purposes — it's only imported by Django's Postgres backend, which
tests never touch. Install everything else individually instead:

```bash
pip install Django==5.0.6 djangorestframework==3.15.1 django-cors-headers==4.3.1 gunicorn==22.0.0
```

You'd only need `psycopg2-binary` working locally if running the dev server
(not tests) outside Docker against real Postgres.

Once set up, run individual files/classes/tests the usual Django way:

```bash
python manage.py test jobs.tests.test_patch.JobPatchTests.test_patch_rejects_invalid_status_type -v 2
```

## Running the playwright end-to-end tests

```bash
docker compose up -d                        # app must already be running
docker compose --profile e2e run --rm e2e
```

Playwright specs live in `frontend/e2e/` (one file per user flow: create,
update status, delete) and drive the real app in a headless browser against
the real backend and Postgres — nothing is mocked. The `e2e` service only
builds/runs when explicitly requested via `--profile e2e`; it's excluded from
a plain `docker compose up`. It uses its own Dockerfile
(`frontend/Dockerfile.e2e`, based on `mcr.microsoft.com/playwright`) since the
main frontend image is Alpine-based and Playwright's bundled browsers don't
support musl libc. Each spec creates its own uniquely-named job and cleans up
after itself via direct API calls, so they don't collide with each other, with
seeded demo data, or with each other across repeated runs.

## Known tradeoffs and performance considerations

**Pagination as first step** I have added pagination support on the backend and frontend
to scale the initial solution. 
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

**Job search (`?search=`) is a regex match (`name__iregex`), which cannot use
a standard B-tree index.** `GET /api/jobs/?search=<pattern>` supports both
plain substrings and real regex, but every search is a full table scan
regardless of table size. Fine at hundreds/low-thousands of jobs; at larger
scale this will need a proper index or a dedicated search service. 

The frontend debounces input (300ms) before firing a request so typing itself
never blocks on network latency and the server isn't hit on every keystroke,
but that only reduces request *volume* — it doesn't change the per-request
cost of an unindexed scan.

## Future improvements 
- A multi threaded web server with connection pooling ( gunicorn )
- Cursor based pagination as opposed to offset-based
- Add a composite index for faster retrieval + search support
- Caching ( consider read-to-write ration, granularity of caching )
- Rate limits, metrics, and observability
- Read replicas to support higher read throughput. Caveat - Do we need to support read-after-write consistency?
- etag support for consistency - noop if etag matches on retrieval, error if etag mismatches on write
- authn, authz support
- State transition validation. Currently, the UI/API can set the job status to whatever value. In a real system, we would need certain well defined state transitions ( Succeeded to Running, for instance)
- UX : Filter jobs by state. 
- UX : Accessibility