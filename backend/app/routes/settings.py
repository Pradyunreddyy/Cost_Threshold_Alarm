import sqlite3
from pathlib import Path

from fastapi import APIRouter
from pydantic import BaseModel, Field
from typing import Literal

router = APIRouter(
    prefix="/api/settings",
    tags=["Application Settings"],
)

DATABASE_PATH = Path(__file__).resolve().parents[2] / "settings.db"


def get_connection():
    connection = sqlite3.connect(DATABASE_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def initialize_database():
    with get_connection() as connection:
        connection.execute("""
            CREATE TABLE IF NOT EXISTS app_settings (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                currency TEXT NOT NULL,
                region TEXT NOT NULL,
                monitoring INTEGER NOT NULL,
                email_alerts INTEGER NOT NULL,
                refresh_interval INTEGER NOT NULL
            )
        """)

        connection.execute("""
            INSERT OR IGNORE INTO app_settings
            (id, currency, region, monitoring, email_alerts, refresh_interval)
            VALUES (1, 'INR', 'ap-south-1', 1, 1, 60)
        """)


initialize_database()


class SettingsUpdate(BaseModel):
    currency: Literal["INR", "USD", "EUR", "GBP"]
    region: Literal[
        "ap-south-1",
        "us-east-1",
        "us-west-2",
        "eu-west-1",
    ]
    monitoring: bool
    email_alerts: bool
    refresh_interval: int = Field(
        ge=15,
        le=1440,
    )


@router.get("/")
def get_settings():
    with get_connection() as connection:
        row = connection.execute(
            "SELECT * FROM app_settings WHERE id = 1"
        ).fetchone()

    return {
        "currency": row["currency"],
        "region": row["region"],
        "monitoring": bool(row["monitoring"]),
        "email_alerts": bool(row["email_alerts"]),
        "refresh_interval": str(row["refresh_interval"]),
    }


@router.put("/")
def update_settings(settings: SettingsUpdate):
    with get_connection() as connection:
        connection.execute(
            """
            UPDATE app_settings
            SET currency = ?,
                region = ?,
                monitoring = ?,
                email_alerts = ?,
                refresh_interval = ?
            WHERE id = 1
            """,
            (
                settings.currency,
                settings.region,
                int(settings.monitoring),
                int(settings.email_alerts),
                settings.refresh_interval,
            ),
        )

    return {
        "message": "Settings saved successfully",
        **get_settings(),
    }