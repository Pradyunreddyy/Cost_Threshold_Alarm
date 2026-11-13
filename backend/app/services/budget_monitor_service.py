
from datetime import date, datetime, timedelta

from app.services.aws_cost_service import get_cost_and_usage


def get_budget_date_range(budget: dict, today: date | None = None):
    """
    Calculate the AWS Cost Explorer date range for a budget.
    AWS Cost Explorer uses an exclusive end date.
    """
    today = today or date.today()
    period = budget["period"]

    if period == "Daily":
        start_date = today

    elif period == "Weekly":
        start_date = today - timedelta(days=today.weekday())

    elif period == "Monthly":
        start_date = today.replace(day=1)

    elif period == "Yearly":
        start_date = today.replace(month=1, day=1)

    elif period == "No Deadline":
        created_at = budget.get("created_at")

        if not created_at:
            raise ValueError(
                "Budget creation date is missing."
            )

        if isinstance(created_at, datetime):
            start_date = created_at.date()
        else:
            start_date = datetime.fromisoformat(
                str(created_at)
            ).date()

    else:
        raise ValueError(
            f"Unsupported budget period: {period}"
        )

    return start_date, today + timedelta(days=1)


def calculate_budget_spending(
    budget: dict,
    today: date | None = None,
):
    """
    Fetch actual AWS spending for the budget period
    and calculate budget utilization.
    """
    start_date, end_date = get_budget_date_range(
        budget,
        today,
    )

    if start_date > (today or date.today()):
        raise ValueError(
            "Budget start date cannot be in the future."
        )

    cost_data = get_cost_and_usage(
        start_date=start_date.isoformat(),
        end_date=end_date.isoformat(),
        granularity="DAILY",
    )

    total_spending = sum(
        result["amount"]
        for result in cost_data["results"]
    )

    # Prevent negative AWS adjustments from appearing
    # as negative spending in the budget dashboard.
    total_spending = max(0.0, total_spending)

    budget_amount = float(budget["amount"])

    percentage = (
        (total_spending / budget_amount) * 100
        if budget_amount > 0
        else 0.0
    )

    return {
        "budget_id": budget["id"],
        "budget_name": budget["name"],
        "budget_amount": budget_amount,
        "spent": round(total_spending, 2),
        "percentage": round(percentage, 2),
        "currency": cost_data["currency"],
        "start_date": start_date.isoformat(),
        "end_date": end_date.isoformat(),
        "estimated": any(
            result["estimated"]
            for result in cost_data["results"]
        ),
        "source": cost_data["source"],
    }
