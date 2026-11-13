
from datetime import date, timedelta

from fastapi import APIRouter, HTTPException

from app.services.aws_cost_service import get_cost_and_usage
from app.services.cost_formatting import get_service_category

router = APIRouter()


@router.get("/")
def get_spending_history():
    today = date.today()
    start_date = today - timedelta(days=29)
    end_date = today + timedelta(days=1)

    try:
        data = get_cost_and_usage(
            start_date=start_date.isoformat(),
            end_date=end_date.isoformat(),
            granularity="DAILY",
            group_by_service=True,
        )

        records = []
        estimated = False

        for result in data["results"]:
            estimated = estimated or result["estimated"]

            for group in result["groups"]:
                amount = max(0.0, group["amount"])

                if amount <= 0:
                    continue

                service = group["name"]
                record_date = result["start_date"]

                records.append({
                    "id": f"{record_date}-{service}",
                    "service": service,
                    "category": get_service_category(service),
                    "amount": round(amount, 4),
                    "date": record_date,
                    "description": "AWS Cost Explorer service charge",
                })

        records.sort(
            key=lambda item: (item["date"], item["amount"]),
            reverse=True,
        )

        total_spending = sum(item["amount"] for item in records)

        highest_record = (
            max(records, key=lambda item: item["amount"])
            if records else None
        )

        return {
            "source": data["source"],
            "currency": data["currency"],
            "start_date": start_date.isoformat(),
            "end_date": today.isoformat(),
            "estimated": estimated,
            "total_spending": round(total_spending, 4),
            "record_count": len(records),
            "average_spending": round(
                total_spending / len(records), 4
            ) if records else 0,
            "highest_record": highest_record,
            "records": records,
        }

    except (RuntimeError, ValueError) as error:
        raise HTTPException(
            status_code=502,
            detail=str(error),
        )
