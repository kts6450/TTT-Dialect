"""예약 인메모리 저장소 — 데모용. 운영 시 DB 교체."""

from __future__ import annotations

import secrets
from datetime import datetime
from threading import Lock

_RESERVATIONS: dict[str, dict] = {}
_LOCK = Lock()


def create_reservation(slots: dict) -> dict:
    """슬롯 dict → 예약 레코드 생성 + 8자리 예약 번호 반환."""
    code = secrets.token_hex(4).upper()  # 예: A3F09B12
    record = {
        "code": code,
        "created_at": datetime.utcnow().isoformat(),
        **slots,
    }
    with _LOCK:
        _RESERVATIONS[code] = record
    return record


def get_reservation(code: str) -> dict | None:
    return _RESERVATIONS.get(code.upper())


def list_reservations(phone: str | None = None) -> list[dict]:
    items = list(_RESERVATIONS.values())
    if phone:
        items = [r for r in items if r.get("contact_phone") == phone]
    return items


def delete_reservation(code: str) -> bool:
    with _LOCK:
        return _RESERVATIONS.pop(code.upper(), None) is not None
