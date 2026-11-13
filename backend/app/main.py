
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.budgets import router as budgets_router
from app.routes.analytics import router as analytics_router
from app.routes.aws_services import router as aws_services_router
from app.routes.alerts import router as alerts_router
from app.routes.spending_history import router as spending_history_router
from app.routes.settings import router as settings_router
from app.routes.aws_costs import router as aws_costs_router


app = FastAPI(
    title="Cost Threshold Alarm API",
    description="Backend API for cloud cost monitoring and budget alerts.",
    version="1.0.0",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://cost-threshold-alarm.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(budgets_router)
app.include_router(analytics_router)
app.include_router(aws_services_router)
app.include_router(alerts_router)
app.include_router(spending_history_router)
app.include_router(settings_router)
app.include_router(aws_costs_router)


@app.get("/")
def root():
    return {
        "message": "Cost Threshold Alarm API is running",
        "status": "success",
    }


@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "application": "Cost Threshold Alarm",
        "version": "1.0.0",
    }
