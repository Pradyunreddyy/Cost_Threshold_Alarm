
from datetime import date, timedelta
import calendar

from fastapi import APIRouter, HTTPException, Query

from app.services.aws_cost_service import get_cost_and_usage

router = APIRouter()


def subtract_months(value: date, months: int) -> date:
    month_index = value.year * 12 + value.month - 1 - months
    year = month_index // 12
    month = month_index % 12 + 1
    return date(year, month, 1)


@router.get("/")
def get_analytics(
    period: str = Query(default="Last 30 days"),
    start_date: date | None = Query(default=None),
    end_date: date | None = Query(default=None),
):
    today = date.today()
    tomorrow = today + timedelta(days=1)

    if period == "Last 7 days":
        start = today - timedelta(days=6)
        end = tomorrow
        granularity = "DAILY"

    elif period == "Last 30 days":
        start = today - timedelta(days=29)
        end = tomorrow
        granularity = "DAILY"

    elif period == "Last 3 months":
        start = subtract_months(today, 2)
        end = tomorrow
        granularity = "MONTHLY"

    elif period == "Last 6 months":
        start = subtract_months(today, 5)
        end = tomorrow
        granularity = "MONTHLY"

    elif period == "Last 12 months":
        start = subtract_months(today, 11)
        end = tomorrow
        granularity = "MONTHLY"

    elif period == "Custom":
        if start_date is None or end_date is None:
            raise HTTPException(
                status_code=400,
                detail="Custom period requires start_date and end_date.",
            )

        if start_date > end_date:
            raise HTTPException(
                status_code=400,
                detail="Start date must not be after end date.",
            )

        start = start_date
        end = end_date + timedelta(days=1)

        granularity = (
            "DAILY"
            if (end - start).days <= 90
            else "MONTHLY"
        )

    else:
        raise HTTPException(
            status_code=400,
            detail="Unsupported analytics period.",
        )

    try:
        data = get_cost_and_usage(
            start_date=start.isoformat(),
            end_date=end.isoformat(),
            granularity=granularity,
            group_by_service=True,
        )

        labels = []
        values = []
        service_totals = {}
        estimated = False

        for result in data["results"]:
            result_date = date.fromisoformat(result["start_date"])

            if granularity == "DAILY":
                labels.append(result_date.strftime("%b %d"))
            else:
                labels.append(result_date.strftime("%b %Y"))

            values.append(max(0.0, result["amount"]))
            estimated = estimated or result["estimated"]

            for group in result["groups"]:
                name = group["name"]
                service_totals[name] = (
                    service_totals.get(name, 0) + group["amount"]
                )

        services = [
            {
                "name": name,
                "cost": round(max(0.0, amount), 4),
            }
            for name, amount in service_totals.items()
            if amount > 0
        ]

        services.sort(key=lambda item: item["cost"], reverse=True)

        total_spending = sum(values)
        average_spending = (
            total_spending / len(values) if values else 0
        )

        return {
            "source": data["source"],
            "currency": data["currency"],
            "period": period,
            "start_date": start.isoformat(),
            "end_date": (end - timedelta(days=1)).isoformat(),
            "estimated": estimated,
            "labels": labels,
            "values": [round(value, 4) for value in values],
            "services": services,
            "total_spending": round(total_spending, 4),
            "average_spending": round(average_spending, 4),
            "highest_service": services[0] if services else None,
        }

    except (RuntimeError, ValueError) as error:
        raise HTTPException(
            status_code=502,
            detail=str(error),
        )
