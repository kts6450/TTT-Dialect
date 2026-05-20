"""마스터(운영자) 전용 — 회원·상품·통계 어드민."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select

from db.database import SessionLocal
from db.models import ListingRow, OrderRow, ReviewRow, UserRow
from routers.auth import get_current_user
from services.listings_store import delete_listing

router = APIRouter(prefix="/api/admin", tags=["admin"])


def require_master(user: dict = Depends(get_current_user)) -> dict:
    if user.get("role") != "master":
        raise HTTPException(status_code=403, detail="운영자(마스터) 전용입니다.")
    return user


@router.get("/users")
def list_users(_: dict = Depends(require_master)):
    with SessionLocal() as session:
        rows = session.scalars(select(UserRow).order_by(UserRow.created_at.desc())).all()
        return [
            {
                "id": r.id,
                "email": r.email,
                "role": r.role,
                "display_name": r.display_name,
                "seller_sector": r.seller_sector,
                "seller_id": r.seller_id,
                "created_at": r.created_at,
            }
            for r in rows
        ]


@router.delete("/users/{user_id}")
def remove_user(user_id: str, _: dict = Depends(require_master)):
    with SessionLocal() as session:
        row = session.get(UserRow, user_id)
        if row is None:
            raise HTTPException(status_code=404, detail="user not found")
        session.delete(row)
        session.commit()
    return {"ok": True}


@router.get("/listings")
def list_all_listings(_: dict = Depends(require_master)):
    """모든 셀러의 상품 — 셀러 이메일까지 조인."""
    with SessionLocal() as session:
        listings = session.scalars(
            select(ListingRow).order_by(ListingRow.created_at.desc())
        ).all()
        sellers = {
            u.seller_id: u
            for u in session.scalars(
                select(UserRow).where(UserRow.role == "seller")
            ).all()
            if u.seller_id
        }
        return [
            {
                "id": l.id,
                "title": l.title,
                "kind": l.kind,
                "category": l.category,
                "price": l.price,
                "location": l.location,
                "seller_id": l.seller_id,
                "seller_email": sellers.get(l.seller_id).email if sellers.get(l.seller_id) else None,
                "created_at": l.created_at,
            }
            for l in listings
        ]


@router.delete("/listings/{listing_id}")
def admin_delete_listing(listing_id: str, _: dict = Depends(require_master)):
    if not delete_listing(listing_id):
        raise HTTPException(status_code=404, detail="listing not found")
    return {"ok": True}


@router.get("/stats")
def stats(_: dict = Depends(require_master)):
    with SessionLocal() as session:
        users_n = session.scalar(select(func.count()).select_from(UserRow)) or 0
        consumers_n = session.scalar(
            select(func.count()).select_from(UserRow).where(UserRow.role == "consumer")
        ) or 0
        sellers_n = session.scalar(
            select(func.count()).select_from(UserRow).where(UserRow.role == "seller")
        ) or 0
        listings_n = session.scalar(select(func.count()).select_from(ListingRow)) or 0
        orders_n = session.scalar(select(func.count()).select_from(OrderRow)) or 0
        paid_n = session.scalar(
            select(func.count()).select_from(OrderRow).where(OrderRow.payment_status == "paid")
        ) or 0
        revenue = session.scalar(
            select(func.coalesce(func.sum(OrderRow.total), 0)).where(OrderRow.payment_status == "paid")
        ) or 0
        reviews_n = session.scalar(select(func.count()).select_from(ReviewRow)) or 0
    return {
        "users": users_n,
        "consumers": consumers_n,
        "sellers": sellers_n,
        "listings": listings_n,
        "orders": orders_n,
        "paid_orders": paid_n,
        "revenue": int(revenue),
        "reviews": reviews_n,
    }
