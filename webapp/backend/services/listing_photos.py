"""상품 추가 사진 (갤러리)."""

from __future__ import annotations

import base64
import binascii
import uuid
from datetime import datetime
from pathlib import Path

from sqlalchemy import select

from db.database import SessionLocal
from db.models import ListingPhotoRow

_RUNTIME = Path(__file__).resolve().parent.parent / "data" / "runtime"
_PHOTOS_DIR = _RUNTIME / "listing_photos"


def _ensure_dir():
    _PHOTOS_DIR.mkdir(parents=True, exist_ok=True)


def list_photos(listing_id: str) -> list[dict]:
    with SessionLocal() as session:
        rows = session.scalars(
            select(ListingPhotoRow)
            .where(ListingPhotoRow.listing_id == listing_id)
            .order_by(ListingPhotoRow.sort_order, ListingPhotoRow.created_at)
        ).all()
        return [
            {"id": r.id, "url": r.url, "sort_order": r.sort_order, "created_at": r.created_at}
            for r in rows
        ]


def _decode_b64(raw: str) -> bytes | None:
    s = raw.strip()
    if s.startswith("data:"):
        try:
            s = s.split(",", 1)[1]
        except IndexError:
            return None
    try:
        data = base64.b64decode(s, validate=False)
    except (ValueError, binascii.Error):
        return None
    if len(data) > 8_000_000:
        return None
    return data


def add_photo(listing_id: str, *, image_base64: str | None = None, url: str | None = None) -> dict:
    pid = f"ph-{uuid.uuid4().hex[:12]}"
    final_url: str
    if image_base64:
        data = _decode_b64(image_base64)
        if not data:
            raise ValueError("이미지를 해석할 수 없습니다.")
        _ensure_dir()
        path = _PHOTOS_DIR / f"{pid}.png"
        path.write_bytes(data)
        final_url = f"/api/marketplace/listings/{listing_id}/photos/{pid}.png"
    elif url:
        final_url = url.strip()
        if not final_url:
            raise ValueError("URL 이 비어 있습니다.")
    else:
        raise ValueError("image_base64 또는 url 이 필요합니다.")

    with SessionLocal() as session:
        next_order = session.scalar(
            select(ListingPhotoRow.sort_order)
            .where(ListingPhotoRow.listing_id == listing_id)
            .order_by(ListingPhotoRow.sort_order.desc())
        )
        order = (next_order or 0) + 1
        row = ListingPhotoRow(
            id=pid,
            listing_id=listing_id,
            url=final_url,
            sort_order=order,
            created_at=datetime.utcnow().isoformat(),
        )
        session.add(row)
        session.commit()
        return {"id": row.id, "url": row.url, "sort_order": row.sort_order}


def photo_file_path(photo_id: str) -> Path:
    return _PHOTOS_DIR / f"{photo_id}.png"


def delete_photo(photo_id: str) -> bool:
    with SessionLocal() as session:
        row = session.get(ListingPhotoRow, photo_id)
        if not row:
            return False
        session.delete(row)
        session.commit()
    p = photo_file_path(photo_id)
    if p.is_file():
        try:
            p.unlink()
        except OSError:
            pass
    return True


def get_photo_listing_id(photo_id: str) -> str | None:
    with SessionLocal() as session:
        row = session.get(ListingPhotoRow, photo_id)
        return row.listing_id if row else None
