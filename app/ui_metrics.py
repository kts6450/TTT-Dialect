"""
고령층 UI 검증용 경량 이벤트 로깅.
"""

from __future__ import annotations

import csv
import json
import time
from pathlib import Path


class UIMetricsLogger:
    def __init__(self, log_path: str = "./evaluation/results/ui_events.csv"):
        self.path = Path(log_path)
        self.path.parent.mkdir(parents=True, exist_ok=True)
        if not self.path.exists():
            with self.path.open("w", newline="", encoding="utf-8") as f:
                writer = csv.writer(f)
                writer.writerow(
                    [
                        "timestamp",
                        "session_id",
                        "user_id",
                        "event_type",
                        "task_id",
                        "value",
                        "meta_json",
                    ]
                )

    def log(
        self,
        session_id: str,
        user_id: str,
        event_type: str,
        task_id: str = "",
        value: float | int | str = "",
        meta: dict | None = None,
    ) -> None:
        with self.path.open("a", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            writer.writerow(
                [
                    f"{time.time():.3f}",
                    session_id,
                    user_id,
                    event_type,
                    task_id,
                    value,
                    json.dumps(meta or {}, ensure_ascii=False),
                ]
            )
