"""리뷰·평점 — 결제 완료한 구매자만 작성."""

from __future__ import annotations

import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import func, select

from db.database import SessionLocal
from db.models import OrderRow, ReviewRow
from routers.auth import get_current_user

router = APIRouter(prefix="/api/marketplace/listings", tags=["reviews"])


class ReviewCreate(BaseModel):
    rating: int = Field(ge=1, le=5)
    body: str = Field(default="", max_length=2000)
    order_id: str | None = Field(default=None, max_length=48)


def _row_to_dict(r: ReviewRow) -> dict:
    return {
        "id": r.id,
        "listing_id": r.listing_id,
        "order_id": r.order_id,
        "user_id": r.user_id,
        "user_name": r.user_name,
        "rating": r.rating,
        "body": r.body or "",
        "created_at": r.created_at,
    }


@router.get("/{listing_id}/reviews")
def get_reviews(listing_id: str):
    with SessionLocal() as session:
        rows = session.scalars(
            select(ReviewRow)
            .where(ReviewRow.listing_id == listing_id)
            .order_by(ReviewRow.created_at.desc())
        ).all()
        avg = session.scalar(
            select(func.avg(ReviewRow.rating)).where(ReviewRow.listing_id == listing_id)
        )
    return {
        "count": len(rows),
        "average": round(float(avg), 1) if avg else 0.0,
        "items": [_row_to_dict(r) for r in rows],
    }


@router.post("/{listing_id}/reviews")
def post_review(
    listing_id: str,
    body: ReviewCreate,
    user: dict = Depends(get_current_user),
):
    if user.get("role") not in ("consumer", "master"):
        raise HTTPException(status_code=403, detail="구매자만 리뷰를 작성할 수 있습니다.")

    text = (body.body or "").strip()

    with SessionLocal() as session:
        if user.get("role") == "consumer":
            paid_orders = session.scalars(
                select(OrderRow).where(
                    OrderRow.buyer_id == user.get("id"),
                    OrderRow.payment_status == "paid",
                )
            ).all()

            owned = False
            order_match: str | None = body.order_id
            for o in paid_orders:
                try:
                    import json as _json

                    items = _json.loads(o.items_json or "[]")
                except ValueError:
                    items = []
                for it in items:
                    if it.get("listing_id") == listing_id:
                        owned = True
                        if not order_match:
                            order_match = o.id
                        break
                if owned:
                    break
            if not owned:
                raise HTTPException(
                    status_code=403,
                    detail="구매·결제한 상품에만 리뷰를 남길 수 있습니다.",
                )

            already = session.scalar(
                select(ReviewRow.id).where(
                    ReviewRow.listing_id == listing_id,
                    ReviewRow.user_id == user.get("id"),
                )
            )
            if already:
                raise HTTPException(status_code=409, detail="이미 리뷰를 작성하셨습니다.")
        else:
            order_match = body.order_id

        row = ReviewRow(
            id=f"rv-{uuid.uuid4().hex[:12]}",
            listing_id=listing_id,
            order_id=order_match,
            user_id=user.get("id") or "master",
            user_name=user.get("display_name") or "익명",
            rating=body.rating,
            body=text,
            created_at=datetime.utcnow().isoformat(),
        )
        session.add(row)
        session.commit()
        session.refresh(row)
        return _row_to_dict(row)
