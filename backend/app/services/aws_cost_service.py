
import os

import boto3
from botocore.exceptions import ClientError, BotoCoreError

AWS_REGION = os.getenv("AWS_DEFAULT_REGION", "us-east-1")


def get_cost_explorer_client():
    """
    Use boto3's standard credential chain.

    On EC2, this uses the attached IAM instance role.
    Locally, it can use environment credentials or an AWS profile.
    """
    return boto3.client("ce", region_name=AWS_REGION)


def get_cost_and_usage(
    start_date: str,
    end_date: str,
    granularity: str = "DAILY",
    group_by_service: bool = False,
):
    """
    Retrieve actual AWS Cost Explorer spending.

    The end date is exclusive.
    Optionally group costs by AWS service.
    """

    if start_date >= end_date:
        raise ValueError("Start date must be earlier than end date.")

    if granularity not in ("DAILY", "MONTHLY"):
        raise ValueError("Unsupported Cost Explorer granularity.")

    try:
        client = get_cost_explorer_client()

        params = {
            "TimePeriod": {
                "Start": start_date,
                "End": end_date,
            },
            "Granularity": granularity,
            "Metrics": ["UnblendedCost"],
        }

        if group_by_service:
            params["GroupBy"] = [
                {
                    "Type": "DIMENSION",
                    "Key": "SERVICE",
                }
            ]

        results = []

        while True:
            response = client.get_cost_and_usage(**params)

            for item in response.get("ResultsByTime", []):
                cost_data = item.get("Total", {}).get(
                    "UnblendedCost", {}
                )

                groups = []

                for group in item.get("Groups", []):
                    group_cost = group.get("Metrics", {}).get(
                        "UnblendedCost", {}
                    )

                    keys = group.get("Keys", [])

                    groups.append({
                        "name": keys[0] if keys else "Other",
                        "amount": float(
                            group_cost.get("Amount", 0)
                        ),
                        "unit": group_cost.get("Unit", "USD"),
                    })

                results.append({
                    "start_date": item["TimePeriod"]["Start"],
                    "end_date": item["TimePeriod"]["End"],
                    "amount": float(
                        cost_data.get("Amount", 0)
                    ),
                    "unit": cost_data.get("Unit", "USD"),
                    "estimated": item.get("Estimated", False),
                    "groups": groups,
                })

            next_token = response.get("NextPageToken")

            if not next_token:
                break

            params["NextPageToken"] = next_token

        return {
            "source": "aws_cost_explorer",
            "currency": "USD",
            "granularity": granularity,
            "results": results,
        }

    except (ClientError, BotoCoreError) as error:
        raise RuntimeError(
            f"AWS Cost Explorer request failed: {error}"
        ) from error
