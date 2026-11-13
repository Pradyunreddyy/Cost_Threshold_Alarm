
import sqlite3

from pathlib import Path
from typing import Literal

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.services.budget_monitor_service import (
    calculate_budget_spending,
)

from app.services.alert_service import (
    generate_threshold_alerts,
    mark_email_sent,
)

from app.services.sns_service import send_sns_notification


router = APIRouter(prefix="/api/budgets", tags=["Budgets"])

DATABASE_PATH = Path(__file__).resolve().parents[2] / "budgets.db"


def get_connection():
    connection = sqlite3.connect(DATABASE_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def initialize_database():
    with get_connection() as connection:
        connection.execute("""
            CREATE TABLE IF NOT EXISTS budgets (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                amount REAL NOT NULL,
                spent REAL NOT NULL DEFAULT 0,
                period TEXT NOT NULL,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
        """)

        columns = {
            row["name"]
            for row in connection.execute(
                "PRAGMA table_info(budgets)"
            ).fetchall()
        }

        if "created_at" not in columns:
            connection.execute(
                "ALTER TABLE budgets ADD COLUMN created_at TEXT"
            )

        connection.execute("""
            UPDATE budgets
            SET created_at = CURRENT_TIMESTAMP
            WHERE created_at IS NULL OR created_at = ''
        """)


initialize_database()


class BudgetCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    amount: float = Field(gt=0)
    period: Literal[
        "Daily",
        "Weekly",
        "Monthly",
        "Yearly",
        "No Deadline",
    ]


class BudgetUpdate(BudgetCreate):
    pass


@router.get("/")
def get_budgets():
    """
    Return budgets with actual AWS spending.

    This endpoint does not generate alerts or send emails.
    """

    with get_connection() as connection:
        budgets = [
            dict(row)
            for row in connection.execute(
                "SELECT * FROM budgets ORDER BY id"
            ).fetchall()
        ]

    updated_budgets = []

    for budget in budgets:
        try:
            spending = calculate_budget_spending(budget)

            budget["spent"] = spending["spent"]

            with get_connection() as connection:
                connection.execute(
                    """
                    UPDATE budgets
                    SET spent = ?
                    WHERE id = ?
                    """,
                    (
                        spending["spent"],
                        budget["id"],
                    ),
                )

            updated_budgets.append(budget)

        except (RuntimeError, ValueError, KeyError) as error:
            raise HTTPException(
                status_code=502,
                detail=(
                    f"Unable to retrieve actual spending for "
                    f"budget '{budget['name']}': {error}"
                ),
            )

    return updated_budgets


@router.post("/", status_code=201)
def create_budget(budget: BudgetCreate):
    with get_connection() as connection:
        cursor = connection.execute(
            """
            INSERT INTO budgets (name, amount, spent, period, created_at)
            VALUES (?, ?, 0, ?, CURRENT_TIMESTAMP)
            """,
            (
                budget.name.strip(),
                budget.amount,
                budget.period,
            ),
        )

        row = connection.execute(
            "SELECT * FROM budgets WHERE id = ?",
            (cursor.lastrowid,),
        ).fetchone()

        return dict(row)


@router.put("/{budget_id}")
def update_budget(budget_id: int, budget: BudgetUpdate):
    with get_connection() as connection:
        existing = connection.execute(
            "SELECT id FROM budgets WHERE id = ?",
            (budget_id,),
        ).fetchone()

        if existing is None:
            raise HTTPException(
                status_code=404,
                detail="Budget not found",
            )

        connection.execute(
            """
            UPDATE budgets
            SET name = ?, amount = ?, period = ?
            WHERE id = ?
            """,
            (
                budget.name.strip(),
                budget.amount,
                budget.period,
                budget_id,
            ),
        )

        row = connection.execute(
            "SELECT * FROM budgets WHERE id = ?",
            (budget_id,),
        ).fetchone()

        return dict(row)


@router.delete("/{budget_id}")
def delete_budget(budget_id: int):
    with get_connection() as connection:
        cursor = connection.execute(
            "DELETE FROM budgets WHERE id = ?",
            (budget_id,),
        )

        if cursor.rowcount == 0:
            raise HTTPException(
                status_code=404,
                detail="Budget not found",
            )

        return {
            "message": "Budget deleted successfully",
            "id": budget_id,
        }


@router.post("/monitor")
def monitor_budgets():
    """
    Fetch actual AWS spending, update budgets,
    generate threshold alerts, and send SNS emails.
    """

    with get_connection() as connection:
        budgets = [
            dict(row)
            for row in connection.execute(
                "SELECT * FROM budgets ORDER BY id"
            ).fetchall()
        ]

    results = []
    failures = []
    email_notifications = []

    for budget in budgets:
        try:
            spending = calculate_budget_spending(budget)

            with get_connection() as connection:
                connection.execute(
                    """
                    UPDATE budgets
                    SET spent = ?
                    WHERE id = ?
                    """,
                    (
                        spending["spent"],
                        budget["id"],
                    ),
                )

            alerts = generate_threshold_alerts(spending)

            for alert in alerts:
                try:
                    notification = send_sns_notification(
                        subject=(
                            f"Cost Threshold Alarm - "
                            f"{alert['threshold']}% Budget Alert"
                        ),
                        message=alert["message"],
                    )

                    mark_email_sent(alert["alert_id"])

                    email_notifications.append({
                        "alert_id": alert["alert_id"],
                        "budget_id": alert["budget_id"],
                        "threshold": alert["threshold"],
                        "status": "sent",
                        "message_id": notification["message_id"],
                    })

                except (RuntimeError, ValueError) as error:
                    email_notifications.append({
                        "alert_id": alert["alert_id"],
                        "budget_id": alert["budget_id"],
                        "threshold": alert["threshold"],
                        "status": "failed",
                        "error": str(error),
                    })

            spending["generated_alerts"] = alerts
            results.append(spending)

        except (RuntimeError, ValueError, KeyError) as error:
            failures.append({
                "budget_id": budget["id"],
                "budget_name": budget["name"],
                "error": str(error),
            })

    return {
        "message": "Budget monitoring completed",
        "total_budgets": len(budgets),
        "successful": len(results),
        "failed": len(failures),
        "results": results,
        "failures": failures,
        "email_notifications": email_notifications,
    }
