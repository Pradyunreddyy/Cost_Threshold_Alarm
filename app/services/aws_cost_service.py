
import os
from datetime import date

import boto3
from dotenv import load_dotenv
from botocore.exceptions import ClientError, BotoCoreError

# Load credentials from backend/.env
load_dotenv()

AWS_REGION = os.getenv("AWS_DEFAULT_REGION", "us-east-1")


def get_cost_explorer_client():
    """Create an AWS Cost Explorer client using environment credentials."""
    return boto3.client(
        "ce",
        region_name=AWS_REGION,
        aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
        aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
        aws_session_token=os.getenv("AWS_SESSION_TOKEN"),
    )


def get_cost_and_usage(start_date: str, end_date: str,
                       granularity: str = "DAILY"):
    """
    Retrieve actual AWS spending from Cost Explorer.

    end_date is exclusive, as required by AWS Cost Explorer.
    """
    try:
        client = get_cost_explorer_client()

        response = client.get_cost_and_usage(
            TimePeriod={
                "Start": start_date,
                "End": end_date,
            },
            Granularity=granularity,
            Metrics=["UnblendedCost"],
        )

        results = []

        for item in response.get("ResultsByTime", []):
            cost_data = item.get("Total", {}).get(
                "UnblendedCost", {}
            )

            results.append({
                "start_date": item["TimePeriod"]["Start"],
                "end_date": item["TimePeriod"]["End"],
                "amount": float(cost_data.get("Amount", 0)),
                "unit": cost_data.get("Unit", "USD"),
                "estimated": item.get("Estimated", False),
            })

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
