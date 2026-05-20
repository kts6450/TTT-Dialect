from __future__ import annotations

from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel, Field, field_validator

from services.auth_service import (
    AuthError,
    login_user,
    register_user,
    user_from_token_payload,
)
from services.auth_tokens import decode_access_token

router = APIRouter(prefix="/api/auth", tags=["auth"])


class RegisterBody(BaseModel):
    email: str = Field(min_length=3, max_length=200)
    password: str = Field(min_length=8, max_length=128)
    role: str
    display_name: str = Field(min_length=1, max_length=100)
    seller_sector: str | None = Field(default=None, max_length=24)

    @field_validator("role")
    @classmethod
    def _role_ok(cls, v: str) -> str:
        if v not in ("consumer", "seller"):
            raise ValueError("role must be consumer or seller")
        return v


class LoginBody(BaseModel):
    email: str = Field(min_length=3, max_length=200)
    password: str = Field(min_length=1, max_length=128)


def get_current_user(authorization: str | None = Header(default=None)) -> dict:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="로그인이 필요합니다.")
    token = authorization[7:].strip()
    payload = decode_access_token(token)
    if not payload or not payload.get("sub"):
        raise HTTPException(status_code=401, detail="로그인이 만료되었습니다.")
    return user_from_token_payload(payload)


@router.post("/register")
def post_register(body: RegisterBody):
    try:
        return register_user(
            email=body.email,
            password=body.password,
            role=body.role,
            display_name=body.display_name,
            seller_sector=body.seller_sector,
        )
    except AuthError as e:
        raise HTTPException(status_code=e.status, detail=e.message) from e


@router.post("/login")
def post_login(body: LoginBody):
    try:
        return login_user(email=body.email, password=body.password)
    except AuthError as e:
        raise HTTPException(status_code=e.status, detail=e.message) from e


@router.get("/me")
def get_me(user: dict = Depends(get_current_user)):
    return {"user": user}
