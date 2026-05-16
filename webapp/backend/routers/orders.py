"""주문 + 모의 결제 API."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from services.orders_store import create_order, mock_pay

router = APIRouter(prefix="/api/orders", tags=["orders"])


class OrderItemIn(BaseModel):
    listing_id: str
    quantity: int = Field(ge=1, le=999)


class OrderCreate(BaseModel):
    items: list[OrderItemIn] = Field(min_length=1)
    buyer_name: str = Field(min_length=1, max_length=100)
    buyer_phone: str = Field(min_length=5, max_length=30)


@router.post("")
def post_order(body: OrderCreate):
    try:
        return create_order(
            items=[i.model_dump() for i in body.items],
            buyer_name=body.buyer_name,
            buyer_phone=body.buyer_phone,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e


@router.post("/{order_id}/mock-pay")
def pay_mock(order_id: str):
    try:
        return mock_pay(order_id)
    except KeyError:
        raise HTTPException(status_code=404, detail="order not found") from None
