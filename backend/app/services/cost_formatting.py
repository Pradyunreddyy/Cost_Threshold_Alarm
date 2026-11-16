def get_service_category(service_name: str) -> str:
    name = service_name.lower().strip()

    categories = {
        "Compute": [
            "ec2", "elastic compute cloud", "lambda", "ecs", "eks",
            "lightsail", "batch", "fargate", "elastic beanstalk",
        ],
        "Storage": [
            "s3", "simple storage service", "ebs", "efs", "glacier", "backup",
        ],
        "Database": [
            "rds", "dynamodb", "redshift", "elasticache", "documentdb", "aurora",
        ],
        "Networking": [
            "data transfer", "virtual private cloud", "vpc",
            "route 53", "cloudfront", "direct connect", "api gateway",
        ],
        "Monitoring": [
            "cloudwatch", "cloudtrail", "config", "guardduty",
            "security hub", "cloudwatch events",
        ],
        "Notifications": [
            "sns", "simple notification service",
            "sqs", "simple queue service", "ses", "simple email service",
        ],
        "Security": [
            "key management service", "kms", "secrets manager",
            "certificate manager", "waf", "shield",
        ],
        "Cost Management": [
            "cost explorer", "billing", "budgets",
        ],
    }

    for category, keywords in categories.items():
        if any(keyword in name for keyword in keywords):
            return category

    return "Other"
