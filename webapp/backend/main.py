"""로컬링크 백엔드 — FastAPI (마켓플레이스 + 음성).

실행:
    cd webapp/backend
    uvicorn main:app --reload --port 8088
"""

from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

_PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
load_dotenv(_PROJECT_ROOT / ".env")

from routers import marketplace, orders, voice  # noqa: E402

app = FastAPI(title="로컬링크 Local Link — API")

_default_cors = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:8080",
    "http://127.0.0.1:8080",
]
_extra = os.environ.get("CORS_EXTRA_ORIGINS", "")
_origins = [
    *_default_cors,
    *[o.strip() for o in _extra.split(",") if o.strip()],
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(marketplace.router)
app.include_router(orders.router)
app.include_router(voice.router)


@app.get("/health")
def health():
    return {"status": "ok"}
