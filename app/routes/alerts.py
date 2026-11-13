
import json
import sqlite3
from pathlib import Path
from typing import List

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr, Field

router = APIRouter(
    prefix="/api/alerts",
    tags=["Alerts & Notifications"],
)

DATABASE_PATH = Path(__file__).resolve().parents[2] / "alerts.db"


def get_connection():
    connection = sqlite3.connect(DATABASE_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def initialize_database():
    with get_connection() as connection:
        connection.execute("""
            CREATE TABLE IF NOT EXISTS alert_settings (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                thresholds TEXT NOT NULL,
                email_enabled INTEGER NOT NULL DEFAULT 0,
                email TEXT,
                in_app_enabled INTEGER NOT NULL DEFAULT 1
            )
        """)

        connection.execute("""
            CREATE TABLE IF NOT EXISTS alert_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                message TEXT NOT NULL,
                threshold INTEGER NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        connection.execute("""
            INSERT OR IGNORE INTO alert_settings
            (id, thresholds, email_enabled, email, in_app_enabled)
            VALUES (1, '[50, 80, 90, 100]', 0, '', 1)
        """)


initialize_database()


class AlertSettingsUpdate(BaseModel):
    thresholds: List[int] = Field(
        min_length=1,
        max_length=10,
    )
    email_enabled: bool = False
    email: str = ""
    in_app_enabled: bool = True


@router.get("/settings")
def get_alert_settings():
    with get_connection() as connection:
        row = connection.execute(
            "SELECT * FROM alert_settings WHERE id = 1"
        ).fetchone()

        return {
            "thresholds": json.loads(row["thresholds"]),
            "email_enabled": bool(row["email_enabled"]),
            "email": row["email"] or "",
            "in_app_enabled": bool(row["in_app_enabled"]),
        }


@router.put("/settings")
def update_alert_settings(settings: AlertSettingsUpdate):
    if any(
        threshold < 1 or threshold > 100
        for threshold in settings.thresholds
    ):
        raise HTTPException(
            status_code=400,
            detail="Thresholds must be between 1 and 100.",
        )

    if len(set(settings.thresholds)) != len(settings.thresholds):
        raise HTTPException(
            status_code=400,
            detail="Duplicate thresholds are not allowed.",
        )

    if settings.email_enabled and not settings.email.strip():
        raise HTTPException(
            status_code=400,
            detail="Enter an email address to enable email notifications.",
        )

    with get_connection() as connection:
        connection.execute(
            """
            UPDATE alert_settings
            SET thresholds = ?,
                email_enabled = ?,
                email = ?,
                in_app_enabled = ?
            WHERE id = 1
            """,
            (
                json.dumps(sorted(settings.thresholds)),
                int(settings.email_enabled),
                settings.email.strip(),
                int(settings.in_app_enabled),
            ),
        )

    return {
        "message": "Alert settings saved successfully",
        **get_alert_settings(),
    }


@router.get("/history")
def get_alert_history():
    with get_connection() as connection:
        rows = connection.execute(
            "SELECT * FROM alert_history ORDER BY id DESC"
        ).fetchall()

        return [dict(row) for row in rows]


@router.delete("/history")
def clear_alert_history():
    with get_connection() as connection:
        connection.execute("DELETE FROM alert_history")

    return {
        "message": "Alert history cleared successfully"
    }
