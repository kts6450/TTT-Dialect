"""목록 변경 버전 — SSE로 소비자·판매자 화면에 푸시."""

from __future__ import annotations

import threading

_lock = threading.Lock()
_version = 0


def bump_listings_version() -> None:
    global _version
    with _lock:
        _version += 1


def get_listings_version() -> int:
    with _lock:
        return _version
