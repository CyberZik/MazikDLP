# MazikDLP Backend

Enterprise AI Data Loss Prevention Platform — Backend API

## 🏗️ Architecture

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              ← FastAPI entry point & middleware
│   ├── config.py             ← Pydantic settings (env-based)
│   ├── database.py           ← SQLAlchemy + Redis setup
│   ├── api/                  ← Route handlers
│   │   ├── __init__.py       ← API router registry
│   │   └── health.py         ← Health check endpoints
│   ├── models/               ← SQLAlchemy ORM models
│   ├── schemas/              ← Pydantic request/response schemas
│   ├── services/             ← Business logic layer
│   ├── detectors/            ← Detection engine modules
│   ├── middleware/            ← Custom middleware
│   └── utils/                ← Shared utilities
├── alembic/                  ← Database migrations
│   ├── env.py
│   ├── script.py.mako
│   └── versions/
├── scripts/
│   └── init_db.sql           ← DB initialization script
├── tests/
├── alembic.ini
├── docker-compose.yml        ← PostgreSQL + Redis + API
├── Dockerfile
├── requirements.txt
├── .env                      ← Local config (Docker)
├── .env.example              ← Template
└── README.md
```

## 🚀 Quick Start

### Option A: Docker (Recommended)

One command to start everything:

```bash
cd backend
docker-compose up --build
```

This starts:
- **FastAPI API** → http://localhost:8000
- **PostgreSQL** → localhost:5432
- **Redis** → localhost:6379

Wait for all services to show "healthy" in logs (~60 seconds on first run due to spaCy model download).

### Option B: Manual Setup

#### 1. Start PostgreSQL & Redis (using Docker)

```bash
# Start only the databases
docker-compose up -d postgres redis
```

#### 2. Set Up Python Environment

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate it
# On macOS/Linux:
source venv/bin/activate
# On Windows:
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Download spaCy model (required for Presidio)
python -m spacy download en_core_web_lg
```

#### 3. Configure Environment

```bash
# Copy and edit .env for local development
cp .env.example .env

# Edit .env — change DB_HOST and REDIS_HOST to 'localhost':
# DB_HOST=localhost
# REDIS_HOST=localhost
```

#### 4. Run the API

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## ✅ Verify It's Working

### Test 1: Root Endpoint

```bash
curl http://localhost:8000/
```

**Expected Response:**
```json
{
  "service": "MazikDLP",
  "version": "1.0.0",
  "status": "running",
  "docs": "/docs",
  "health": "/api/v1/health"
}
```

### Test 2: Basic Health Check

```bash
curl http://localhost:8000/api/v1/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "service": "MazikDLP",
  "version": "1.0.0",
  "environment": "development",
  "timestamp": "2025-01-11T10:30:00.000000+00:00"
}
```

### Test 3: Detailed Health Check (DB + Redis)

```bash
curl http://localhost:8000/api/v1/health/detailed
```

**Expected Response:**
```json
{
  "status": "healthy",
  "service": "MazikDLP",
  "version": "1.0.0",
  "environment": "development",
  "uptime_seconds": 42.5,
  "timestamp": "2025-01-11T10:30:00.000000+00:00",
  "checks": {
    "postgresql": {
      "status": "healthy",
      "latency_ms": 1.23,
      "host": "postgres",
      "database": "mazikdlp"
    },
    "redis": {
      "status": "healthy",
      "latency_ms": 0.45,
      "host": "redis",
      "used_memory": "1.05M"
    }
  }
}
```

### Test 4: Swagger UI (Interactive API Docs)

Open in your browser:

```
http://localhost:8000/docs
```

You should see the FastAPI Swagger UI with all available endpoints.

### Test 5: Readiness & Liveness

```bash
# Kubernetes-style readiness probe
curl http://localhost:8000/api/v1/health/ready

# Kubernetes-style liveness probe
curl http://localhost:8000/api/v1/health/live
```

## 🛑 Troubleshooting

### Port Already in Use
```bash
# Check what's using port 8000
lsof -i :8000
# Kill it
kill -9 <PID>
```

### Docker Containers Not Starting
```bash
# Check logs
docker-compose logs -f

# Rebuild from scratch
docker-compose down -v
docker-compose up --build
```

### PostgreSQL Connection Refused
- If running manually, make sure DB_HOST=localhost in .env
- If running via Docker, make sure DB_HOST=postgres in .env

### Redis Connection Refused
- Same as above: REDIS_HOST=localhost for manual, REDIS_HOST=redis for Docker

### spaCy Model Not Found
```bash
python -m spacy download en_core_web_lg
```

## 📋 Available Endpoints (Module 1)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Root — service info |
| GET | `/docs` | Swagger UI |
| GET | `/redoc` | ReDoc UI |
| GET | `/api/v1/health` | Basic health check |
| GET | `/api/v1/health/detailed` | Detailed health (DB + Redis) |
| GET | `/api/v1/health/ready` | Kubernetes readiness |
| GET | `/api/v1/health/live` | Kubernetes liveness |

## 🔜 Next Modules

After confirming this runs, we'll add:
- Module 2: Configuration System (feature flags, dynamic config)
- Module 3: Database Core (base models, timestamps, soft delete)
- Module 4: Middleware (rate limiting, error handling)
- Module 5+: Auth, Users, Detection, Policies, Scanning...
