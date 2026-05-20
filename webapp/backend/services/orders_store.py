"""주문 + 모의 결제 — SQLite (목록과 동일 DB)."""

from __future__ import annotations

import json
import secrets
import uuid
from datetime import datetime

from sqlalchemy import select

from db.database import SessionLocal
from db.models import OrderRow
from services.listings_store import get_listing


_VALID_FULFILLMENT = ("pending", "preparing", "shipping", "completed", "cancelled")


def _row_to_order_dict(row: OrderRow) -> dict:
    items = json.loads(row.items_json) if row.items_json else []
    payment = json.loads(row.payment_json) if row.payment_json else None
    return {
        "id": row.id,
        "created_at": row.created_at,
        "buyer_id": row.buyer_id,
        "buyer_name": row.buyer_name,
        "buyer_phone": row.buyer_phone,
        "items": items,
        "total": row.total,
        "payment_status": row.payment_status,
        "fulfillment_status": row.fulfillment_status or "pending",
        "stay_start": row.stay_start,
        "stay_end": row.stay_end,
        "payment": payment,
    }


def list_orders() -> list[dict]:
    with SessionLocal() as session:
        rows = session.scalars(select(OrderRow).order_by(OrderRow.created_at.desc())).all()
        return [_row_to_order_dict(r) for r in rows]


def list_orders_for_buyer(buyer_id: str) -> list[dict]:
    if not buyer_id:
        return []
    with SessionLocal() as session:
        rows = session.scalars(
            select(OrderRow)
            .where(OrderRow.buyer_id == buyer_id)
            .order_by(OrderRow.created_at.desc())
        ).all()
        return [_row_to_order_dict(r) for r in rows]


def list_orders_for_seller(seller_id: str) -> list[dict]:
    """주문 라인 중 하나라도 해당 셀러 상품이 있으면 포함."""
    if not seller_id:
        return []
    from services.listings_store import get_listing

    out: list[dict] = []
    for o in list_orders():
        for it in o.get("items", []):
            lid = it.get("listing_id")
            listing = get_listing(lid) if lid else None
            if listing and listing.get("seller_id") == seller_id:
                out.append(o)
                break
    return out


def get_order(order_id: str) -> dict | None:
    with SessionLocal() as session:
        row = session.get(OrderRow, order_id)
        return _row_to_order_dict(row) if row else None


def set_fulfillment_status(order_id: str, status: str) -> dict:
    if status not in _VALID_FULFILLMENT:
        raise ValueError(f"invalid status: {status}")
    with SessionLocal() as session:
        row = session.get(OrderRow, order_id)
        if row is None:
            raise KeyError(order_id)
        row.fulfillment_status = status
        session.commit()
        return _row_to_order_dict(row)


def has_booking_conflict(
    listing_id: str,
    stay_start: str,
    stay_end: str,
) -> bool:
    """동일 숙박이 이미 그 날짜에 예약되었는지 (체크인 포함, 체크아웃 제외)."""
    if not stay_start or not stay_end or stay_start >= stay_end:
        return False
    with SessionLocal() as session:
        candidates = session.scalars(
            select(OrderRow).where(
                OrderRow.fulfillment_status.in_(("preparing", "shipping", "completed")),
                OrderRow.stay_start.isnot(None),
                OrderRow.stay_end.isnot(None),
            )
        ).all()
    for o in candidates:
        if not (o.stay_start and o.stay_end):
            continue
        # 날짜 범위 겹침 (반-열림 구간)
        if not (o.stay_end <= stay_start or o.stay_start >= stay_end):
            try:
                items = json.loads(o.items_json or "[]")
            except ValueError:
                items = []
            if any(it.get("listing_id") == listing_id for it in items):
                return True
    return False


def create_order(
    *,
    items: list[dict],
    buyer_name: str,
    buyer_phone: str,
    buyer_id: str | None = None,
    stay_start: str | None = None,
    stay_end: str | None = None,
) -> dict:
    lines = []
    total = 0
    for it in items:
        lid = it.get("listing_id")
        qty = int(it.get("quantity") or 1)
        listing = get_listing(lid) if lid else None
        if not listing:
            raise ValueError(f"상품을 찾을 수 없습니다: {lid}")
        if listing.get("kind") == "lodging" and stay_start and stay_end:
            if has_booking_conflict(lid, stay_start, stay_end):
                raise ValueError(f"이미 예약된 날짜가 있습니다: {listing.get('title')}")
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
        "buyer_id": buyer_id,
        "buyer_name": buyer_name.strip(),
        "buyer_phone": buyer_phone.strip(),
        "items": lines,
        "total": total,
        "payment_status": "pending",
        "fulfillment_status": "pending",
        "stay_start": stay_start,
        "stay_end": stay_end,
        "payment": None,
    }
    row = OrderRow(
        id=order["id"],
        created_at=order["created_at"],
        buyer_id=buyer_id,
        buyer_name=order["buyer_name"],
        buyer_phone=order["buyer_phone"],
        items_json=json.dumps(lines, ensure_ascii=False),
        total=total,
        payment_status="pending",
        fulfillment_status="pending",
        stay_start=stay_start,
        stay_end=stay_end,
        payment_json=None,
    )
    with SessionLocal() as session:
        session.add(row)
        session.commit()
    return order


def _complete_pay(order_id: str, method: str, message: str, txn_prefix: str) -> dict:
    txn = f"{txn_prefix}-{secrets.token_hex(6).upper()}"
    paid_at = datetime.utcnow().isoformat()
    pay = {
        "method": method,
        "transaction_id": txn,
        "paid_at": paid_at,
        "message": message,
    }
    pay_json = json.dumps(pay, ensure_ascii=False)
    with SessionLocal() as session:
        row = session.get(OrderRow, order_id)
        if row is None:
            raise KeyError(order_id)
        row.payment_status = "paid"
        if row.fulfillment_status in (None, "pending"):
            row.fulfillment_status = "preparing"
        row.payment_json = pay_json
        session.commit()
        return _row_to_order_dict(row)


def mock_pay(order_id: str) -> dict:
    return _complete_pay(
        order_id,
        "mock_card",
        "(데모) 실제 결제는 이루어지지 않았습니다.",
        "MOCK-TXN",
    )


def card_pay_demo(order_id: str) -> dict:
    return _complete_pay(
        order_id,
        "card",
        "(시연) 카드·간편결제 승인 시뮬레이션입니다. 실제 청구는 없습니다.",
        "CARD-TXN",
    )
