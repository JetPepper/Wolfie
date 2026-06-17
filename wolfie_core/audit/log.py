import json
import sqlite3
from threading import Lock
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

from wolfie_core.broker.environment import ENVIRONMENT, EXECUTION_ENGINE, SOURCE_MODE


class AuditLog:
    def __init__(self, db_path: Optional[Path] = None):
        self.db_path = db_path or Path("data/wolfie.sqlite3")
        if str(self.db_path) != ":memory:":
            self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self._connection = sqlite3.connect(str(self.db_path), check_same_thread=False)
        self._connection.row_factory = sqlite3.Row
        self._lock = Lock()
        self._create_table()

    def record(
        self,
        event_type: str,
        summary: str,
        payload: Optional[Dict[str, Any]] = None,
        order_related: bool = False,
    ) -> Dict[str, Any]:
        event = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "event_type": event_type,
            "environment": ENVIRONMENT,
            "source_mode": SOURCE_MODE,
            "live_order_submitted": False if order_related else False,
            "execution_engine": EXECUTION_ENGINE if order_related else None,
            "summary": summary,
            "payload": payload or {},
        }
        with self._lock:
            self._connection.execute(
                """
                INSERT INTO audit_events (
                    timestamp, event_type, environment, source_mode,
                    live_order_submitted, execution_engine, summary, payload
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    event["timestamp"],
                    event["event_type"],
                    event["environment"],
                    event["source_mode"],
                    int(event["live_order_submitted"]),
                    event["execution_engine"],
                    event["summary"],
                    json.dumps(event["payload"], sort_keys=True),
                ),
            )
            self._connection.commit()
        return event

    def list_events(self) -> List[Dict[str, Any]]:
        with self._lock:
            rows = self._connection.execute(
                """
                SELECT timestamp, event_type, environment, source_mode,
                       live_order_submitted, execution_engine, summary, payload
                FROM audit_events
                ORDER BY id ASC
                """
            ).fetchall()
        events = []
        for row in rows:
            events.append(
                {
                    "timestamp": row["timestamp"],
                    "event_type": row["event_type"],
                    "environment": row["environment"],
                    "source_mode": row["source_mode"],
                    "live_order_submitted": bool(row["live_order_submitted"]),
                    "execution_engine": row["execution_engine"],
                    "summary": row["summary"],
                    "payload": json.loads(row["payload"]),
                }
            )
        return events

    def _create_table(self):
        with self._lock:
            self._connection.execute(
                """
                CREATE TABLE IF NOT EXISTS audit_events (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp TEXT NOT NULL,
                    event_type TEXT NOT NULL,
                    environment TEXT NOT NULL,
                    source_mode TEXT NOT NULL,
                    live_order_submitted INTEGER NOT NULL,
                    execution_engine TEXT,
                    summary TEXT NOT NULL,
                    payload TEXT NOT NULL
                )
                """
            )
            self._connection.commit()
