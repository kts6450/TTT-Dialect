"""예약 CRUD."""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from services.reservation_store import (
    create_reservation,
    delete_reservation,
    get_reservation,
    list_reservations,
)


class ReservationIn(BaseModel):
    experience_id: str
    date: str | None = None
    time: str | None = None
    headcount: int | None = None
    contact_name: str | None = None
    contact_phone: str | None = None


router = APIRouter(prefix="/api/reservations", tags=["reservations"])


@router.post("")
def create(body: ReservationIn):
    return create_reservation(body.model_dump())


@router.get("")
def list_all(phone: str | None = None):
    return list_reservations(phone)


@router.get("/{code}")
def get_one(code: str):
    rec = get_reservation(code)
    if rec is None:
        raise HTTPException(status_code=404, detail="reservation not found")
    return rec


@router.delete("/{code}")
def cancel(code: str):
    if not delete_reservation(code):
        raise HTTPException(status_code=404, detail="reservation not found")
    return {"ok": True}
