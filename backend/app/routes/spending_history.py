
import sqlite3
from pathlib import Path

from fastapi import APIRouter

router = APIRouter(
    prefix="/api/spending-history",
    tags=["Spending History"],
)

DATABASE_PATH = Path(__file__).resolve().parents[2] / "spending_history.db"


def get_connection():
    connection = sqlite3.connect(DATABASE_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def initialize_database():
    with get_connection() as connection:
        connection.execute("""
            CREATE TABLE IF NOT EXISTS spending_records (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                service TEXT NOT NULL,
                category TEXT NOT NULL,
                amount REAL NOT NULL,
                date TEXT NOT NULL,
                description TEXT NOT NULL
            )
        """)

        count = connection.execute(
            "SELECT COUNT(*) FROM spending_records"
        ).fetchone()[0]

        if count == 0:
            connection.executemany(
                """
                INSERT INTO spending_records
                (service, category, amount, date, description)
                VALUES (?, ?, ?, ?, ?)
                """,
                [
                    ("Amazon EC2", "Compute", 32.50, "2026-11-13", "Instance usage"),
                    ("Amazon S3", "Storage", 14.20, "2026-11-12", "Storage and requests"),
                    ("AWS Lambda", "Compute", 9.70, "2026-11-11", "Function invocations"),
                    ("Amazon RDS", "Database", 7.50, "2026-11-10", "Database usage"),
                    ("Amazon CloudWatch", "Monitoring", 2.80, "2026-11-09", "Logs and monitoring"),
                    ("Amazon SNS", "Notifications", 1.70, "2026-11-08", "Notification usage"),
                ],
            )


initialize_database()


@router.get("/")
def get_spending_history():
    with get_connection() as connection:
        rows = connection.execute(
            """
            SELECT * FROM spending_records
            ORDER BY date DESC, id DESC
            """
        ).fetchall()

    records = [dict(row) for row in rows]

    total = sum(record["amount"] for record in records)

    highest = max(
        records,
        key=lambda record: record["amount"],
        default=None,
    )

    average = total / len(records) if records else 0

    return {
        "source": "demo",
        "total_spending": round(total, 2),
        "record_count": len(records),
        "average_spending": round(average, 2),
        "highest_record": highest,
        "records": records,
    }
