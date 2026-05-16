"""마켓플레이스 — 브랜드, 상품·숙박 목록, 판매자 등록."""

from __future__ import annotations

import json
from pathlib import Path

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field, field_validator

from services.listings_store import create_listing, delete_listing, get_listing, list_listings

router = APIRouter(prefix="/api/marketplace", tags=["marketplace"])

_BRAND_PATH = Path(__file__).resolve().parent.parent / "data" / "brand.json"


@router.get("/brand")
def brand():
    with open(_BRAND_PATH, encoding="utf-8") as f:
        return json.load(f)


@router.get("/listings")
def get_listings(kind: str | None = None):
    items = list_listings()
    if kind in ("product", "lodging"):
        items = [x for x in items if x.get("kind") == kind]
    return items


@router.get("/listings/{listing_id}")
def get_one(listing_id: str):
    e = get_listing(listing_id)
    if e is None:
        raise HTTPException(status_code=404, detail="listing not found")
    return e


class ListingCreate(BaseModel):
    kind: str
    title: str = Field(min_length=1, max_length=200)
    description: str = Field(default="", max_length=4000)
    price: int = Field(ge=0, le=100_000_000)
    location: str = Field(default="", max_length=500)
    emoji: str | None = Field(default=None, max_length=8)
    stock: int | None = Field(default=None, ge=0, le=1_000_000)
    max_guests: int | None = Field(default=None, ge=1, le=100)
    seller_id: str = Field(default="seller-local", max_length=80)

    @field_validator("kind")
    @classmethod
    def _kind_ok(cls, v: str) -> str:
        if v not in ("product", "lodging"):
            raise ValueError("kind must be product or lodging")
        return v


@router.post("/listings")
def post_listing(body: ListingCreate):
    return create_listing(body.model_dump())


@router.delete("/listings/{listing_id}")
def remove_listing(listing_id: str):
    if not delete_listing(listing_id):
        raise HTTPException(status_code=404, detail="listing not found")
    return {"ok": True}
