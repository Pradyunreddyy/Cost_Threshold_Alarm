
import json
import sqlite3
from pathlib import Path

DATABASE_PATH = Path(__file__).resolve().parents[2] / "alerts.db"


def get_connection():
    connection = sqlite3.connect(DATABASE_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def initialize_alert_monitoring():
    with get_connection() as connection:
        connection.execute("""
            CREATE TABLE IF NOT EXISTS alert_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                message TEXT NOT NULL,
                threshold INTEGER NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        columns = {
            row["name"]
            for row in connection.execute(
                "PRAGMA table_info(alert_history)"
            ).fetchall()
        }

        if "budget_id" not in columns:
            connection.execute(
                "ALTER TABLE alert_history ADD COLUMN budget_id INTEGER"
            )

        if "period_start" not in columns:
            connection.execute(
                "ALTER TABLE alert_history ADD COLUMN period_start TEXT"
            )

        if "email_sent" not in columns:
            connection.execute(
                "ALTER TABLE alert_history ADD COLUMN email_sent INTEGER DEFAULT 0"
            )

        connection.execute("""
            CREATE UNIQUE INDEX IF NOT EXISTS
            idx_unique_budget_threshold_period
            ON alert_history (budget_id, threshold, period_start)
        """)


def generate_threshold_alerts(spending: dict):
    """
    Generate threshold alerts once per budget period.
    Track email delivery separately to support retries.
    """

    initialize_alert_monitoring()

    with get_connection() as connection:
        settings = connection.execute(
            "SELECT * FROM alert_settings WHERE id = 1"
        ).fetchone()

        if settings is None:
            return []

        in_app_enabled = bool(settings["in_app_enabled"])
        email_enabled = bool(settings["email_enabled"])

        if not in_app_enabled and not email_enabled:
            return []

        thresholds = json.loads(settings["thresholds"])
        generated_alerts = []

        percentage = spending["percentage"]

        for threshold in sorted(set(thresholds)):
            if percentage < threshold:
                continue

            message = (
                f"{spending['budget_name']} has reached "
                f"{threshold}% of its budget. "
                f"Current spending: "
                f"{spending['currency']} "
                f"{spending['spent']:.2f} "
                f"({percentage:.2f}%)."
            )

            connection.execute(
                """
                INSERT OR IGNORE INTO alert_history
                (message, threshold, budget_id, period_start, email_sent)
                VALUES (?, ?, ?, ?, 0)
                """,
                (
                    message,
                    threshold,
                    spending["budget_id"],
                    spending["start_date"],
                ),
            )

            row = connection.execute(
                """
                SELECT id, message, threshold, email_sent
                FROM alert_history
                WHERE budget_id = ?
                  AND threshold = ?
                  AND period_start = ?
                """,
                (
                    spending["budget_id"],
                    threshold,
                    spending["start_date"],
                ),
            ).fetchone()

            if row is None:
                continue

            if in_app_enabled and row["id"]:
                pass

            if email_enabled and not row["email_sent"]:
                generated_alerts.append({
                    "alert_id": row["id"],
                    "budget_id": spending["budget_id"],
                    "threshold": threshold,
                    "message": row["message"],
                    "email_pending": True,
                })

        return generated_alerts


def mark_email_sent(alert_id: int):
    with get_connection() as connection:
        connection.execute(
            """
            UPDATE alert_history
            SET email_sent = 1
            WHERE id = ?
            """,
            (alert_id,),
        )
