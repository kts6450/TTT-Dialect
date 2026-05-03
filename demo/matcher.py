"""
키오스크 메뉴 매칭 로직.

ASR이 뱉은 텍스트 한 덩어리를 받아서
``[(item_id, quantity), ...]`` 형태의 주문 목록으로 변환한다.

단계별 fallback:
    1) 입력을 연결어("랑", "하고", "그리고", ",")로 세그먼트 분할
    2) 각 세그먼트마다 메뉴 키워드 substring 스코어 — 점수 최고 항목 선택
    3) 키워드가 안 잡히면 difflib로 메뉴명과 fuzzy 매칭 (방언 발음 변형 흡수)
    4) 세그먼트별 수량 추출 (한국어 수사 + 단위, 없으면 1)

ASR 의존성 없음 — 텍스트 in / 매치 out 순수 함수다.
"""

from __future__ import annotations

import json
import re
from dataclasses import dataclass
from difflib import SequenceMatcher
from functools import lru_cache
from pathlib import Path
from typing import Iterable

MENU_PATH = Path(__file__).resolve().parent / "menu.json"

# 한국어 수사 (수관형사 + 수사) → 정수
KOREAN_NUMERALS: dict[str, int] = {
    "한": 1, "하나": 1,
    "두": 2, "둘": 2,
    "세": 3, "셋": 3,
    "네": 4, "넷": 4,
    "다섯": 5,
    "여섯": 6,
    "일곱": 7,
    "여덟": 8,
    "아홉": 9,
    "열": 10,
}
# 수량 단위 (메뉴 주문에서 자주 쓰는 것만)
UNITS: tuple[str, ...] = ("마리", "개", "잔", "병", "그릇", "공기", "인분", "판")
# 세그먼트 구분자
SEGMENT_SPLIT = re.compile(r"(?:이?랑|하고|그리고|[,;])")

FUZZY_THRESHOLD = 0.55


@dataclass(frozen=True)
class Match:
    item_id: str
    name: str
    quantity: int
    score: float
    raw_segment: str


@lru_cache(maxsize=1)
def load_menu(path: str | None = None) -> dict:
    p = Path(path) if path else MENU_PATH
    with open(p, encoding="utf-8") as f:
        return json.load(f)


def _flatten_items(menu: dict) -> list[dict]:
    items: list[dict] = []
    for cat in menu.get("categories", []):
        items.extend(cat.get("items", []))
    return items


def _norm(s: str) -> str:
    """공백 제거 — substring 비교를 띄어쓰기 변형에 둔감하게."""
    return re.sub(r"\s+", "", s)


def _split_segments(text: str) -> list[str]:
    if not text:
        return []
    parts = SEGMENT_SPLIT.split(text)
    return [p.strip() for p in parts if p and p.strip()]


def _build_quantity_pattern() -> re.Pattern:
    # 긴 토큰부터 매칭되도록 정렬 (alternation은 leftmost-match)
    numerals = sorted(KOREAN_NUMERALS.keys(), key=len, reverse=True)
    num_alt = "|".join(numerals)
    unit_alt = "|".join(UNITS)
    # "두 개", "한마리", "3 잔" 등
    return re.compile(rf"(\d+|{num_alt})\s*(?:{unit_alt})")


_QTY_PATTERN = _build_quantity_pattern()
_BARE_NUMERALS = ("하나", "둘", "셋", "넷")


def extract_quantity(segment: str) -> int:
    """세그먼트에서 수량 추출. 못 찾으면 1."""
    m = _QTY_PATTERN.search(segment)
    if m:
        token = m.group(1)
        if token.isdigit():
            return int(token)
        return KOREAN_NUMERALS.get(token, 1)

    # 단위 없이 수사만 ("콜라 하나", "후치 하나만")
    for word in _BARE_NUMERALS:
        if word in segment:
            return KOREAN_NUMERALS[word]

    return 1


def _score_keywords(segment_norm: str, item: dict) -> int:
    """키워드별 substring 매칭 점수 — 매칭된 키워드 길이의 합."""
    keywords = {_norm(k) for k in item.get("keywords", []) if k}
    return sum(len(kw) for kw in keywords if kw and kw in segment_norm)


def _best_keyword_match(segment: str, items: Iterable[dict]) -> tuple[dict | None, int]:
    norm = _norm(segment)
    best, best_score = None, 0
    for item in items:
        s = _score_keywords(norm, item)
        if s > best_score:
            best, best_score = item, s
    return best, best_score


def _best_fuzzy_match(segment: str, items: Iterable[dict]) -> tuple[dict | None, float]:
    norm = _norm(segment)
    best, best_ratio = None, 0.0
    for item in items:
        r = SequenceMatcher(None, _norm(item["name"]), norm).ratio()
        if r > best_ratio:
            best, best_ratio = item, r
    return best, best_ratio


def _match_segment(segment: str, items: list[dict]) -> tuple[dict, float] | None:
    item, score = _best_keyword_match(segment, items)
    if item is not None and score > 0:
        return item, 1.0

    item, ratio = _best_fuzzy_match(segment, items)
    if item is not None and ratio >= FUZZY_THRESHOLD:
        return item, ratio

    return None


def match(text: str, menu: dict | None = None) -> list[Match]:
    """텍스트 → 매치 리스트. 못 찾으면 빈 리스트.

    같은 item_id가 여러 세그먼트에 등장하면 첫 등장만 유지한다 (수량은
    각 세그먼트에서 추출한 값). 중복 합산은 호출 측에서 결정.
    """
    if not text or not text.strip():
        return []

    items = _flatten_items(menu or load_menu())
    segments = _split_segments(text)
    if not segments:
        # 분할 결과가 비면 전체를 단일 세그먼트로 취급
        segments = [text.strip()]

    results: list[Match] = []
    seen: set[str] = set()
    for seg in segments:
        m = _match_segment(seg, items)
        if m is None:
            continue
        item, score = m
        if item["id"] in seen:
            continue
        seen.add(item["id"])
        results.append(Match(
            item_id=item["id"],
            name=item["name"],
            quantity=extract_quantity(seg),
            score=score,
            raw_segment=seg,
        ))
    return results
