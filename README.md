**Project Overview**

- **Description:** A small full-stack bridge module providing location and engineering design data (states, districts, wind/seismic/temperature profiles) with a Django REST backend and a Vite + React frontend.

**Tech Stack**

- **Backend:** Django (REST framework), PostgreSQL
- **Frontend:** React + Vite (TypeScript)
- **Dev / Orchestration:** Docker Compose

**Quick Start (recommended — Docker)**

- **Clone the repo:**

  ```bash
  git clone <repo-url>
  cd osdag-bridge-module
  ```

- **Run full stack (builds images and starts services):**

  ```bash
  docker compose up --build
  ```

- The frontend dev server will be available on port `3000` (Vite) and the backend on port `8000`.

- After the services are up, run migrations and seed the DB inside the backend container:

  ```bash
  docker exec -it osdag_backend python manage.py migrate
  docker exec -it osdag_backend python manage.py seed_locations
  docker exec -it osdag_backend python manage.py createsuperuser
  ```

**Manual / Local Development (without Docker)**

- Backend (Python/Django):

  ```bash
  cd backend
  python -m venv .venv
  .venv\Scripts\activate   # Windows
  # or: source .venv/bin/activate  # macOS / Linux
  pip install -r requirements.txt
  ```

- The project expects a PostgreSQL database (settings read `POSTGRES_*` env vars). You can either:

  - Run a local Postgres and set `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD` in `backend/.env`, or
  - Use the Docker Compose Postgres service (recommended) and run Django commands against it.

- Run migrations and seed data locally (after configuring the DB env vars):

  ```bash
  python manage.py migrate
  python manage.py seed_locations
  python manage.py createsuperuser
  ```

- Frontend (Vite + React):

  ```bash
  cd frontend
  npm install
  # Set API base URL in frontend/.env (create if missing):
  # VITE_API_BASE_URL=http://localhost:8000/api
  npm run dev
  ```

**Database & Seeding**

- The project includes a structured JSON dataset at `data/location_engineering_data.json` used by the management command `load_location_engineering_data` (the convenient wrapper command is `seed_locations`).
- To load data:

  ```bash
  python manage.py seed_locations
  # or, to point at a different JSON file:
  python manage.py seed_locations --file path/to/file.json
  ```

**Backend API (routes)**

- Base API is mounted at `/api/` (see [config/urls.py](config/urls.py)). Useful endpoints:

- **Get states:** `GET /api/states/`
- **Get districts:** `GET /api/districts/`
- **District details:** `GET /api/districts/<id>/details/`
- **Find closest location:** `GET /api/closest/`

**Files of interest**

- **Docker composition:** [docker-compose.yml](docker-compose.yml)
- **Django settings:** [backend/config/settings.py](backend/config/settings.py)
- **Backend requirements:** [backend/requirements.txt](backend/requirements.txt)
- **Frontend notes:** [frontend/README.md](frontend/README.md)

**Development Notes & Tips**

- The frontend reads `VITE_API_BASE_URL` (see [frontend/README.md](frontend/README.md)). If unset, it defaults to `http(s)://<current-host>:8000/api`, which works with the default Docker setup.
- The backend expects Postgres connection info via environment variables. When using Docker Compose, the `db` service and envs are defined in [docker-compose.yml](docker-compose.yml).
- The project includes management commands for idempotent ingestion of engineering data: `load_location_engineering_data` (core loader) and the wrapper `seed_locations`.

**Troubleshooting**

- If migrations fail, ensure the database service is running (`db` in Docker Compose) and that `backend/.env` (or your shell) contains correct `POSTGRES_*` values.
- If the frontend cannot reach the API in local dev, set `VITE_API_BASE_URL` in `frontend/.env` and restart the dev server.

**License & Contact**

- This README is a workspace-level description. See repository metadata for license and authorship.
