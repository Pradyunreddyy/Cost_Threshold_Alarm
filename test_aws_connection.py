
from datetime import date, timedelta

from app.services.aws_cost_service import get_cost_and_usage


today = date.today()
start_date = today.replace(day=1)
end_date = today + timedelta(days=1)

try:
    result = get_cost_and_usage(
        start_date=start_date.isoformat(),
        end_date=end_date.isoformat(),
        granularity="MONTHLY",
    )

    print("AWS CONNECTION SUCCESSFUL")
    print("Data source:", result["source"])
    print("Currency:", result["currency"])
    print("Results:")

    for item in result["results"]:
        print(item)

except Exception as error:
    print("AWS CONNECTION FAILED")
    print(error)
