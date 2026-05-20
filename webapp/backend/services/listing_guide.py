"""이용안내 JSON·체험 여부 — listing_ai / listing_package 순환 import 방지."""

from __future__ import annotations

import json

_EXPERIENCE_HINTS = (
    "체험",
    "축제",
    "투어",
    "견학",
    "수확",
    "낚시",
    "만들기",
    "잡기",
    "갯벌",
    "캠핑",
    "승마",
    "트레킹",
    "자전거",
    "요리교실",
    "체험장",
)


def is_experience(title: str, description: str, category: str) -> bool:
    if category in ("experience", "leisure"):
        return True
    t = f"{title} {description}".lower()
    return any(h in t for h in _EXPERIENCE_HINTS)


def parse_guide_json(raw: str | None) -> dict | None:
    if not raw or not str(raw).strip():
        return None
    try:
        data = json.loads(raw)
        return data if isinstance(data, dict) else None
    except json.JSONDecodeError:
        return None


def guide_to_json(guide: dict | None) -> str | None:
    if not guide:
        return None
    return json.dumps(guide, ensure_ascii=False)
