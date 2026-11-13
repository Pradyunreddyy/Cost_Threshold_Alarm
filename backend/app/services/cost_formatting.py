
def get_service_category(service_name: str) -> str:
    name = service_name.lower()

    categories = {
        "Compute": [
            "ec2", "lambda", "ecs", "eks",
            "lightsail", "batch", "fargate",
            "elastic beanstalk",
        ],
        "Storage": [
            "s3", "ebs", "efs", "glacier", "backup",
        ],
        "Database": [
            "rds", "dynamodb", "redshift",
            "elasticache", "documentdb", "aurora",
        ],
        "Monitoring": [
            "cloudwatch", "cloudtrail", "config",
            "guardduty", "security hub",
        ],
        "Notifications": [
            "sns", "ses", "sqs",
        ],
    }

    for category, keywords in categories.items():
        if any(keyword in name for keyword in keywords):
            return category

    return "Other"
