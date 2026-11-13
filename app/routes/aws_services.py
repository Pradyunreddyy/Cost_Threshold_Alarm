
from fastapi import APIRouter

router = APIRouter(
    prefix="/api/aws-services",
    tags=["AWS Services"],
)

SERVICES = [
    {
        "name": "Amazon EC2",
        "category": "Compute",
        "cost": 32.50,
        "usage": "Running instances",
        "status": "Active",
    },
    {
        "name": "Amazon S3",
        "category": "Storage",
        "cost": 14.20,
        "usage": "Storage and requests",
        "status": "Active",
    },
    {
        "name": "AWS Lambda",
        "category": "Compute",
        "cost": 9.70,
        "usage": "Function invocations",
        "status": "Active",
    },
    {
        "name": "Amazon RDS",
        "category": "Database",
        "cost": 7.50,
        "usage": "Database instances",
        "status": "Active",
    },
    {
        "name": "Amazon CloudWatch",
        "category": "Monitoring",
        "cost": 2.80,
        "usage": "Logs and monitoring",
        "status": "Active",
    },
    {
        "name": "Amazon SNS",
        "category": "Notifications",
        "cost": 1.70,
        "usage": "Notifications",
        "status": "Active",
    },
]


@router.get("/")
def get_aws_services():
    total = sum(service["cost"] for service in SERVICES)

    highest_service = max(
        SERVICES,
        key=lambda service: service["cost"],
    )

    services_with_percentage = []

    for service in SERVICES:
        percentage = (
            (service["cost"] / total) * 100
            if total > 0
            else 0
        )

        services_with_percentage.append({
            **service,
            "percentage": round(percentage, 1),
        })

    return {
        "source": "demo",
        "total_cost": round(total, 2),
        "service_count": len(SERVICES),
        "highest_service": highest_service,
        "services": services_with_percentage,
    }
