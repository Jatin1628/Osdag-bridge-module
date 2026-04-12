# 🌉 OSDAG Bridge Module

A full-stack web application for professional bridge design and engineering analysis. Provides location-based engineering data (wind speed, seismic zones, temperature profiles) with an intuitive Django REST backend and modern React + TypeScript frontend.

---

## 📋 Table of Contents

- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Project Structure](#-project-structure)
- [Quick Start (Docker - Recommended)](#-quick-start-docker--recommended)
- [Local Development (No Docker)](#-local-development-no-docker)
- [Database Setup & Seeding](#-database-setup--seeding)
- [Frontend Assets & Configuration](#-frontend-assets--configuration)
- [API Endpoints](#-api-endpoints)
- [Troubleshooting](#-troubleshooting)
- [Development Notes](#-development-notes)

---

## 🛠 Tech Stack

| Component | Technology |
|-----------|-----------|
| **Backend** | Django + Django REST Framework, PostgreSQL |
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS |
| **Orchestration** | Docker & Docker Compose |
| **Development** | Node.js 20, Python 3.11+ |

---

## ✅ Prerequisites

### For Docker (Recommended)
- **Docker**: [Install Docker Desktop](https://www.docker.com/products/docker-desktop)
- **Docker Compose**: Included with Docker Desktop

### For Local Development (Without Docker)
- **Python 3.11+**: [Download Python](https://www.python.org/downloads/)
- **Node.js 18+**: [Download Node.js](https://nodejs.org/)
- **PostgreSQL 12+**: [Download PostgreSQL](https://www.postgresql.org/download/)
- **Git**: [Download Git](https://git-scm.com/)

---

## 📂 Project Structure

```
osdag-bridge-module/
├── backend/                          # Django REST API
│   ├── config/                       # Django project settings
│   │   ├── settings.py              # Main configuration
│   │   ├── urls.py                  # API routes
│   │   └── wsgi.py
│   ├── locations/                    # Core app for location & engineering data
│   │   ├── models.py                # Database models
│   │   ├── views.py                 # API endpoints
│   │   ├── serializers.py           # DRF serializers
│   │   ├── management/commands/     # Management commands
│   │   │   ├── seed_locations.py
│   │   │   └── load_location_engineering_data.py
│   │   └── migrations/
│   ├── requirements.txt              # Python dependencies
│   ├── manage.py                     # Django command runner
│   ├── .env                          # Environment variables (not committed)
│   └── Dockerfile                    # Backend image
│
├── frontend/                         # React + Vite application
│   ├── src/
│   │   ├── pages/
│   │   │   └── BridgeModule.tsx      # Main component with validation
│   │   ├── api/
│   │   │   └── locationApi.ts        # API client
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── public/
│   │   ├── images/                  # Bridge reference images & overlays
│   │   │   ├── base.png             # Clean bridge image
│   │   │   ├── carriageway.png      # Carriageway width label
│   │   │   ├── footpath.png         # Footpath design label
│   │   │   ├── no_of_girders.png    # Number of girders label
│   │   │   └── overhang_width.png   # Overhang width label
│   │   └── logo.png                  # Application logo
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── .env                          # Environment configuration
│   ├── Dockerfile
│   └── nginx.conf
│
├── backend/data/
│   └── location_engineering_data.json  # Engineering data for seeding
│
├── docker-compose.yml                # Service orchestration
└── README.md                          # This file
```

---

## 🚀 Quick Start (Docker) - Recommended

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd osdag-bridge-module
```

### Step 2: Configure Backend Environment

Create `backend/.env`:

```env
POSTGRES_DB=osdag_db
POSTGRES_USER=osdag_user
POSTGRES_PASSWORD=osdag_password
POSTGRES_HOST=db
POSTGRES_PORT=5432
```

> **Note**: When using Docker Compose, `POSTGRES_HOST` should be `db` (the service name).

### Step 3: Start All Services

```bash
docker compose up --build
```

**Output:**
- **Frontend**: http://localhost:3000 (Vite dev server)
- **Backend API**: http://localhost:8000
- **PostgreSQL**: localhost:5432

### Step 4: Setup Database (One-time)

Open a **new terminal** and run:

```bash
# Run migrations
docker exec -it osdag_backend python manage.py migrate

# Seed location & engineering data
docker exec -it osdag_backend python manage.py seed_locations

# Create superuser for Django admin
docker exec -it osdag_backend python manage.py createsuperuser
```

### Step 5: Verify Setup

- **Frontend**: Open http://localhost:3000 in your browser
- **API Status**: http://localhost:8000/api/states/ should return JSON data
- **Admin Panel**: http://localhost:8000/admin (use superuser credentials)

---

## 💻 Local Development (No Docker)

### Backend Setup

#### 1. Navigate to Backend Directory

```bash
cd backend
```

#### 2. Create Virtual Environment

**Windows:**
```bash
python -m venv .venv
.venv\Scripts\activate
```

**macOS / Linux:**
```bash
python3 -m venv .venv
source .venv/bin/activate
```

#### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

#### 4. Configure Environment Variables

Create `backend/.env`:

```env
POSTGRES_DB=osdag_db
POSTGRES_USER=osdag_user
POSTGRES_PASSWORD=osdag_password
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
DEBUG=True
SECRET_KEY=your-secret-key-here
```

#### 5. Setup Database

Ensure PostgreSQL is running locally, then:

```bash
python manage.py migrate
python manage.py seed_locations
python manage.py createsuperuser
```

#### 6. Run Backend Server

```bash
python manage.py runserver 0.0.0.0:8000
```

Backend will be available at: **http://localhost:8000**

---

### Frontend Setup

#### 1. Navigate to Frontend Directory

```bash
cd frontend
```

#### 2. Install Dependencies

```bash
npm install
```

#### 3. Configure API Endpoint

Create `frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:8000/api
```

#### 4. Start Development Server

```bash
npm run dev
```

Frontend will be available at: **http://localhost:5173**

---

## 📊 Database Setup & Seeding

### Initial Migration

Run migrations to create all tables:

```bash
# Docker
docker exec -it osdag_backend python manage.py migrate

# Local
python manage.py migrate
```

### Seed Location Data

Load engineering data from JSON:

```bash
# Docker
docker exec -it osdag_backend python manage.py seed_locations

# Local
python manage.py seed_locations
```

### Using Custom Data File

```bash
python manage.py seed_locations --file path/to/data.json
```

### Create Admin User

```bash
# Docker
docker exec -it osdag_backend python manage.py createsuperuser

# Local
python manage.py createsuperuser
```

---

## 🖼 Frontend Assets & Configuration

### Bridge Reference Images

Place these files in `frontend/public/images/`:

| File | Purpose | Dimensions |
|------|---------|-----------|
| `base.png` | Clean bridge without labels | Same for all |
| `carriageway.png` | Carriageway width overlay | Same for all |
| `footpath.png` | Footpath design overlay | Same for all |
| `no_of_girders.png` | Number of girders overlay | Same for all |
| `overhang_width.png` | Overhang width overlay | Same for all |

**Important**: All images must have **identical dimensions** and be **perfectly aligned**.

### Application Logo

Place `logo.png` in `frontend/public/`:
- Size: 50px height (width auto-scales)
- Format: PNG with transparency (recommended)
- Location: Top-left header

---

## 📡 API Endpoints

### Base URL
```
http://localhost:8000/api
```

### Available Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/states/` | Get all Indian states |
| `GET` | `/districts/` | Get all districts |
| `GET` | `/districts/?state_id=<id>` | Get districts by state |
| `GET` | `/districts/<id>/details/` | Get engineering data for district |
| `POST` | `/closest/` | Find closest matching location (custom params) |

### Example Requests

**Get All States:**
```bash
curl http://localhost:8000/api/states/
```

**Get Districts for State (ID=1):**
```bash
curl http://localhost:8000/api/districts/?state_id=1
```

**Get District Details (ID=42):**
```bash
curl http://localhost:8000/api/districts/42/details/
```

**Find Closest Location:**
```bash
curl -X POST http://localhost:8000/api/closest/ \
  -H "Content-Type: application/json" \
  -d '{
    "wind_speed": 47,
    "seismic_zone": "III",
    "min_temp": 5,
    "max_temp": 45
  }'
```

---

## 🔧 Troubleshooting

### Docker Issues

#### "Port already in use"
```bash
# Kill processes on ports 3000, 8000, 5432
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti :3000 | xargs kill -9
```

#### "db service not starting"
```bash
# Check logs
docker compose logs db

# Restart services
docker compose down -v
docker compose up --build
```

#### "Backend can't connect to database"
- Verify `backend/.env` has `POSTGRES_HOST=db` (not localhost)
- Ensure database migrations ran: `docker exec osdag_backend python manage.py migrate`

---

### Local Development Issues

#### "ModuleNotFoundError" when running Django
```bash
# Activate virtual environment
.venv\Scripts\activate  # Windows
source .venv/bin/activate  # macOS/Linux

# Reinstall requirements
pip install -r requirements.txt
```

#### "psycopg2 connection refused"
- Ensure PostgreSQL is running
- Verify credentials in `backend/.env`
- Check POSTGRES_HOST is `localhost` (not `db`)

**macOS PostgreSQL:**
```bash
brew services start postgresql
```

**Windows**: Use PostgreSQL installer or start the service via Services app

---

#### "Frontend can't reach API"
- Verify backend is running: `http://localhost:8000/api/states/`
- Check `frontend/.env` has correct `VITE_API_BASE_URL`
- Restart frontend dev server: `npm run dev`

#### "npm install fails"
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

---

### Database Issues

#### "Relation does not exist" error
```bash
# Run migrations
python manage.py migrate
```

#### "No data showing up"
```bash
# Seed the database
python manage.py seed_locations

# Verify data
python manage.py shell
>>> from locations.models import State
>>> State.objects.count()
```

---

## 📝 Development Notes

### Real-Time Validation

The frontend includes comprehensive form validation that:
- ✅ Validates all inputs in real-time
- ✅ Shows inline error messages
- ✅ Clears errors when corrected
- ✅ Prevents submission with blocking errors
- ⚠️ Shows warnings for non-blocking issues

### Hover-Based Image Reveal

The right-side reference image shows context-sensitive overlays:
- Hover over **Carriageway Width** → shows carriageway label
- Hover over **Footpath Design** → shows footpath label
- Hover over **Number of Girders** → shows girders label
- Hover over **Overhang Width** → shows overhang label

All overlays fade smoothly with smooth cubic-bezier timing.

### State Management

- **Form State**: React `useState` for all inputs
- **Validation State**: Centralized `formErrors` and `formWarnings` objects
- **Real-time Updates**: onChange handlers trigger immediate validation

### Backend Validation

All API inputs are validated server-side:
- State & district authorization
- Numeric range validation
- Data consistency checks

---

## 📁 Useful Commands

### Docker Commands

```bash
# Start services
docker compose up --build

# Stop services
docker compose down

# Stop and remove volumes
docker compose down -v

# View logs
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f db

# Access container shell
docker exec -it osdag_backend bash
docker exec -it osdag_frontend sh
```

### Django Commands

```bash
# Create migrations
python manage.py makemigrations

# Run migrations
python manage.py migrate

# Seed data
python manage.py seed_locations

# Create superuser
python manage.py createsuperuser

# Django shell
python manage.py shell

# Collect static files
python manage.py collectstatic
```

### npm Commands

```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint
```

---

## 🌐 Deployment Notes

- **Backend**: Ready for WSGI deployment (uWSGI, Gunicorn)
- **Frontend**: Build output ready for static hosting or CDN
- **Database**: Production-grade PostgreSQL recommended
- **Environment**: Never commit `.env` files - use environment variables in production

---

## 📧 Support & Contribution

For issues or questions:
1. Check the **Troubleshooting** section
2. Review application logs
3. Verify all prerequisites are installed
4. Ensure `.env` files are properly configured

---

## 📄 License

See LICENSE file for details.

---

**Happy Building! 🌉**
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
