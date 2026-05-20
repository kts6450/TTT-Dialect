"""SQLite DB (시연·단일 서버). 운영 시 DATABASE_URL로 Postgres 등 교체 가능."""

from __future__ import annotations

import os
from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

_DATA = Path(__file__).resolve().parent.parent / "data"
_RUNTIME = _DATA / "runtime"
_RUNTIME.mkdir(parents=True, exist_ok=True)

_default_sqlite = _RUNTIME / "local_link.db"
DATABASE_URL = os.environ.get("DATABASE_URL", f"sqlite:///{_default_sqlite}")

_connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, connect_args=_connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass
