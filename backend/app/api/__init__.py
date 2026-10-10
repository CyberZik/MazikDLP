"""
MazikDLP - API Routes Package
All API route modules are registered here.
"""

from fastapi import APIRouter

from app.api import health
from app.api import config as config_api
from app.api import auth
from app.api import users
from app.api import scan
from app.api import policies
from app.api import logs
from app.api import ai_apps
from app.api import analytics
from app.api import patterns
from app.api import settings as settings_api
from app.api import redact_image

# ============================================
# Main API Router
# ============================================
api_router = APIRouter(prefix="/api/v1")

# Register sub-routers
api_router.include_router(health.router, tags=["Health"])
api_router.include_router(config_api.router, tags=["Configuration"])
api_router.include_router(auth.router, tags=["Authentication"])
api_router.include_router(users.router, tags=["Users"])
api_router.include_router(scan.router, tags=["Scanning"])
api_router.include_router(policies.router, tags=["Policies"])
api_router.include_router(logs.router, tags=["Logs"])
api_router.include_router(ai_apps.router, tags=["AI Apps"])
api_router.include_router(analytics.router, tags=["Analytics"])
api_router.include_router(patterns.router, tags=["Custom Patterns"])
api_router.include_router(settings_api.router, tags=["Settings"])
api_router.include_router(redact_image.router, tags=["Image Redaction"])

# Future modules will be added here:
# api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
# api_router.include_router(users.router, prefix="/users", tags=["Users"])
# api_router.include_router(policies.router, prefix="/policies", tags=["Policies"])
# api_router.include_router(scan.router, prefix="/scan", tags=["Scanning"])
# api_router.include_router(detection.router, prefix="/detection", tags=["Detection"])
# api_router.include_router(logs.router, prefix="/logs", tags=["Logs"])
# api_router.include_router(analytics.router, prefix="/analytics", tags=["Analytics"])
# api_router.include_router(ai_apps.router, prefix="/ai-apps", tags=["AI Apps"])
# api_router.include_router(patterns.router, prefix="/patterns", tags=["Patterns"])
# api_router.include_router(settings.router, prefix="/settings", tags=["Settings"])
# api_router.include_router(reports.router, prefix="/reports", tags=["Reports"])
