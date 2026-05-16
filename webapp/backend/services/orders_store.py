"""주문 + 모의 결제 저장소 — JSON 파일."""

from __future__ import annotations

import json
import secrets
import uuid
from datetime import datetime
from pathlib import Path
from threading import Lock

from services.listings_store import get_listing

_DATA = Path(__file__).resolve().parent.parent / "data"
_RUNTIME = _DATA / "runtime"
_FILE = _RUNTIME / "orders.json"
_LOCK = Lock()


def _ensure() -> None:
    _RUNTIME.mkdir(parents=True, exist_ok=True)
    if not _FILE.exists():
        _FILE.write_text("[]", encoding="utf-8")


def list_orders() -> list[dict]:
    with _LOCK:
        _ensure()
        return json.loads(_FILE.read_text(encoding="utf-8"))


def create_order(
    *,
    items: list[dict],
    buyer_name: str,
    buyer_phone: str,
) -> dict:
    """items: [{ listing_id, quantity }] — 가격·제목은 현재 목록에서 조회."""
    lines = []
    total = 0
    for it in items:
        lid = it.get("listing_id")
        qty = int(it.get("quantity") or 1)
        listing = get_listing(lid) if lid else None
        if not listing:
            raise ValueError(f"상품을 찾을 수 없습니다: {lid}")
        unit = int(listing.get("price") or 0)
        sub = unit * qty
        total += sub
        lines.append(
            {
                "listing_id": lid,
                "title": listing.get("title"),
                "kind": listing.get("kind"),
                "quantity": qty,
                "unit_price": unit,
                "line_total": sub,
            }
        )

    oid = f"ORD-{uuid.uuid4().hex[:8].upper()}"
    order = {
        "id": oid,
        "created_at": datetime.utcnow().isoformat(),
        "buyer_name": buyer_name.strip(),
        "buyer_phone": buyer_phone.strip(),
        "items": lines,
        "total": total,
        "payment_status": "pending",
        "payment": None,
    }
    with _LOCK:
        _ensure()
        all_o = json.loads(_FILE.read_text(encoding="utf-8"))
        all_o.insert(0, order)
        _FILE.write_text(json.dumps(all_o, ensure_ascii=False, indent=2), encoding="utf-8")
    return order


def mock_pay(order_id: str) -> dict:
    """가짜 결제 성공."""
    with _LOCK:
        _ensure()
        all_o = json.loads(_FILE.read_text(encoding="utf-8"))
        for o in all_o:
            if o.get("id") == order_id:
                txn = f"MOCK-TXN-{secrets.token_hex(6).upper()}"
                o["payment_status"] = "paid"
                o["payment"] = {
                    "method": "mock_card",
                    "transaction_id": txn,
                    "paid_at": datetime.utcnow().isoformat(),
                    "message": "(데모) 실제 결제는 이루어지지 않았습니다.",
                }
                _FILE.write_text(json.dumps(all_o, ensure_ascii=False, indent=2), encoding="utf-8")
                return o
    raise KeyError(order_id)
