
from datetime import date, timedelta

from fastapi import APIRouter, HTTPException

from app.services.aws_cost_service import get_cost_and_usage
from app.services.cost_formatting import get_service_category

router = APIRouter()


@router.get("/")
def get_aws_services():
    today = date.today()
    start_date = today.replace(day=1)
    end_date = today + timedelta(days=1)

    try:
        data = get_cost_and_usage(
            start_date=start_date.isoformat(),
            end_date=end_date.isoformat(),
            granularity="DAILY",
            group_by_service=True,
        )

        service_totals = {}
        estimated = False

        for result in data["results"]:
            estimated = estimated or result["estimated"]

            for group in result["groups"]:
                name = group["name"]
                service_totals[name] = (
                    service_totals.get(name, 0) + group["amount"]
                )

        services = []

        for name, raw_cost in service_totals.items():
            cost = max(0.0, raw_cost)

            if cost <= 0:
                continue

            services.append({
                "name": name,
                "category": get_service_category(name),
                "status": "Billing data available",
                "cost": round(cost, 4),
                "usage": "Cost Explorer billing data",
            })

        total_cost = sum(item["cost"] for item in services)

        for service in services:
            service["percentage"] = (
                round(service["cost"] / total_cost * 100, 2)
                if total_cost > 0 else 0
            )

        services.sort(key=lambda item: item["cost"], reverse=True)

        highest_service = services[0] if services else None

        return {
            "source": data["source"],
            "currency": data["currency"],
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat(),
            "estimated": estimated,
            "total_cost": round(total_cost, 4),
            "service_count": len(services),
            "highest_service": highest_service,
            "services": services,
        }

    except (RuntimeError, ValueError) as error:
        raise HTTPException(
            status_code=502,
            detail=str(error),
        )
