
from fastapi import APIRouter

router = APIRouter(prefix="/api/analytics", tags=["Cost Analytics"])

CHART_DATA = {
    "Last 7 days": {
        "labels": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        "values": [8, 12, 9, 15, 11, 7, 6.4],
    },
    "Last 30 days": {
        "labels": ["Week 1", "Week 2", "Week 3", "Week 4"],
        "values": [35, 48, 42, 68.4],
    },
    "Last 3 months": {
        "labels": ["Month 1", "Month 2", "Month 3"],
        "values": [120, 145, 168.4],
    },
    "Last 6 months": {
        "labels": ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
        "values": [80, 95, 110, 125, 140, 168.4],
    },
    "Last 12 months": {
        "labels": ["Jan", "Mar", "May", "Jul", "Sep", "Nov"],
        "values": [60, 75, 90, 110, 135, 168.4],
    },
}

SERVICES = [
    {"name": "Amazon EC2", "cost": 32.5},
    {"name": "Amazon S3", "cost": 14.2},
    {"name": "AWS Lambda", "cost": 9.7},
    {"name": "Amazon RDS", "cost": 7.5},
    {"name": "Other Services", "cost": 4.5},
]


@router.get("/")
def get_cost_analytics(period: str = "Last 30 days"):
    selected_data = CHART_DATA.get(
        period,
        CHART_DATA["Last 30 days"],
    )

    total = sum(service["cost"] for service in SERVICES)

    average = (
        total / len(selected_data["values"])
        if selected_data["values"]
        else 0
    )

    highest_service = max(
        SERVICES,
        key=lambda service: service["cost"],
    )

    return {
        "source": "demo",
        "period": period,
        "labels": selected_data["labels"],
        "values": selected_data["values"],
        "services": SERVICES,
        "total_spending": round(total, 2),
        "average_spending": round(average, 2),
        "highest_service": highest_service,
    }
