
import os

import boto3
from dotenv import load_dotenv
from botocore.exceptions import ClientError, BotoCoreError

load_dotenv()

AWS_REGION = os.getenv("AWS_DEFAULT_REGION", "us-east-1")
SNS_TOPIC_ARN = os.getenv("SNS_TOPIC_ARN", "")


def get_sns_client():
    return boto3.client(
        "sns",
        region_name=AWS_REGION,
        aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
        aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
        aws_session_token=os.getenv("AWS_SESSION_TOKEN"),
    )


def send_sns_notification(subject: str, message: str):
    if not SNS_TOPIC_ARN:
        raise RuntimeError("SNS_TOPIC_ARN is not configured.")

    try:
        client = get_sns_client()

        response = client.publish(
            TopicArn=SNS_TOPIC_ARN,
            Subject=subject[:100],
            Message=message,
        )

        return {
            "success": True,
            "message_id": response["MessageId"],
        }

    except (ClientError, BotoCoreError) as error:
        raise RuntimeError(
            f"SNS notification failed: {error}"
        ) from error
