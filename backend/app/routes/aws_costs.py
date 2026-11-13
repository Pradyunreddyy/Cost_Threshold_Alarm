
from datetime import date, timedelta

from fastapi import APIRouter, HTTPException, Query

from app.services.aws_cost_service import get_cost_and_usage

router = APIRouter(
    prefix="/api/aws-costs",
    tags=["AWS Cost Explorer"],
)


@router.get("/")
def get_aws_costs(
    start_date: date = Query(
        default_factory=lambda: date.today().replace(day=1)
    ),
    end_date: date = Query(
        default_factory=lambda: date.today() + timedelta(days=1)
    ),
    granularity: str = Query(
        default="DAILY",
        pattern="^(DAILY|MONTHLY)$",
    ),
):
    if start_date >= end_date:
        raise HTTPException(
            status_code=400,
            detail="start_date must be earlier than end_date.",
        )

    try:
        return get_cost_and_usage(
            start_date=start_date.isoformat(),
            end_date=end_date.isoformat(),
            granularity=granularity,
        )

    except RuntimeError as error:
        raise HTTPException(
            status_code=502,
            detail=str(error),
        ) from error
