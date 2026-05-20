"""액세스 토큰 (HMAC 서명, 외부 JWT 라이브러리 없음)."""

from __future__ import annotations

import base64
import hashlib
import hmac
import json
import os
import time


def _secret() -> bytes:
    raw = os.environ.get("LOCAL_LINK_AUTH_SECRET", "").strip()
    if not raw:
        raw = "local-link-dev-secret-change-in-production"
    return raw.encode()


def create_access_token(payload: dict, *, days: int = 7) -> str:
    data = {**payload, "exp": int(time.time()) + days * 86400}
    body = base64.urlsafe_b64encode(json.dumps(data, separators=(",", ":")).encode()).decode()
    body = body.rstrip("=")
    sig = hmac.new(_secret(), body.encode(), hashlib.sha256).digest()
    sig_b64 = base64.urlsafe_b64encode(sig).decode().rstrip("=")
    return f"{body}.{sig_b64}"


def decode_access_token(token: str) -> dict | None:
    if not token or "." not in token:
        return None
    body, sig_b64 = token.rsplit(".", 1)
    pad = "=" * (-len(body) % 4)
    try:
        expected = hmac.new(_secret(), body.encode(), hashlib.sha256).digest()
        got = base64.urlsafe_b64decode(sig_b64 + pad)
        if not hmac.compare_digest(expected, got):
            return None
        raw = base64.urlsafe_b64decode(body + pad)
        data = json.loads(raw)
    except (ValueError, json.JSONDecodeError):
        return None
    if not isinstance(data, dict):
        return None
    exp = data.get("exp")
    if not isinstance(exp, int) or exp < int(time.time()):
        return None
    return data
