"""체험 카탈로그 — JSON 파일에서 로드 + 검색."""

from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path

CATALOG_PATH = Path(__file__).resolve().parent.parent / "data" / "catalog.json"


@lru_cache(maxsize=1)
def load_catalog() -> dict:
    with open(CATALOG_PATH, encoding="utf-8") as f:
        return json.load(f)


def list_experiences() -> list[dict]:
    return load_catalog()["experiences"]


def get_experience(exp_id: str) -> dict | None:
    return next((e for e in list_experiences() if e["id"] == exp_id), None)


def search_experiences(query: str) -> list[dict]:
    """간단한 키워드 매칭 검색."""
    if not query.strip():
        return list_experiences()
    q = query.strip().lower()
    matches = []
    for exp in list_experiences():
        haystack = " ".join(
            [
                exp["name"],
                exp.get("description", ""),
                exp.get("category", ""),
                exp.get("region", ""),
                " ".join(exp.get("keywords", [])),
            ]
        ).lower()
        if q in haystack:
            matches.append(exp)
    return matches


def catalog_summary_for_llm() -> str:
    """Claude 시스템 프롬프트에 주입할 카탈로그 요약 (간결)."""
    lines = []
    for e in list_experiences():
        lines.append(
            f"- {e['name']} (id: {e['id']}) — {e['category']}/{e['region']}, "
            f"{e['duration_min']}분, {e['price']:,}원, {e['location']}, "
            f"가능 요일: {','.join(e['schedule'])}"
        )
    return "\n".join(lines)
