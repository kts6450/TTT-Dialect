"""상품·숙박 목록 저장소 — 시드 + runtime JSON (운영 시 DB로 교체 가능)."""

from __future__ import annotations

import json
import shutil
import uuid
from datetime import datetime
from pathlib import Path
from threading import Lock

_DATA = Path(__file__).resolve().parent.parent / "data"
_RUNTIME = _DATA / "runtime"
_SEED = _DATA / "listings.seed.json"
_FILE = _RUNTIME / "listings.json"
_LOCK = Lock()


def _ensure_file() -> None:
    _RUNTIME.mkdir(parents=True, exist_ok=True)
    if not _FILE.exists():
        if _SEED.exists():
            shutil.copy(_SEED, _FILE)
        else:
            _FILE.write_text("[]", encoding="utf-8")


def list_listings() -> list[dict]:
    with _LOCK:
        _ensure_file()
        raw = _FILE.read_text(encoding="utf-8")
    return json.loads(raw)


def listings_summary_for_llm() -> str:
    lines = []
    for e in list_listings():
        k = "상품" if e.get("kind") == "product" else "숙박"
        loc = e.get("location", "")
        price = e.get("price", 0)
        lines.append(
            f"- [{k}] {e.get('title', '')} (id: {e.get('id')}) — {price:,}원, {loc}"
        )
    return "\n".join(lines) if lines else "(등록된 물건이 아직 없습니다.)"


def get_listing(listing_id: str) -> dict | None:
    for e in list_listings():
        if e.get("id") == listing_id:
            return e
    return None


def create_listing(record: dict) -> dict:
    now = datetime.utcnow().isoformat()
    lid = record.get("id") or f"L-{uuid.uuid4().hex[:10]}"
    item = {
        "id": lid,
        "seller_id": record.get("seller_id") or "seller-local",
        "kind": record.get("kind") or "product",
        "title": (record.get("title") or "").strip() or "이름 없음",
        "description": (record.get("description") or "").strip(),
        "price": int(record.get("price") or 0),
        "emoji": record.get("emoji") or ("🏷️" if record.get("kind") == "product" else "🏠"),
        "location": (record.get("location") or "").strip(),
        "stock": record.get("stock"),
        "max_guests": record.get("max_guests"),
        "created_at": now,
    }
    if item["kind"] not in ("product", "lodging"):
        item["kind"] = "product"
    if item["kind"] == "product" and item["stock"] is None:
        item["stock"] = 99
    if item["kind"] == "lodging":
        item["stock"] = None
        if item["max_guests"] is None:
            item["max_guests"] = 4

    with _LOCK:
        _ensure_file()
        items = json.loads(_FILE.read_text(encoding="utf-8"))
        items.insert(0, item)
        _FILE.write_text(json.dumps(items, ensure_ascii=False, indent=2), encoding="utf-8")
    return item


def delete_listing(listing_id: str) -> bool:
    with _LOCK:
        _ensure_file()
        items = json.loads(_FILE.read_text(encoding="utf-8"))
        new_items = [x for x in items if x.get("id") != listing_id]
        if len(new_items) == len(items):
            return False
        _FILE.write_text(json.dumps(new_items, ensure_ascii=False, indent=2), encoding="utf-8")
        return True
