"""메뉴 매처 단위 테스트.

ASR/임베딩 모델 다운로드 없이 통과해야 한다 (텍스트 in / 매치 out).
"""

from __future__ import annotations

import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from matcher import (  # noqa: E402
    KOREAN_NUMERALS,
    extract_quantity,
    match,
)


# ── 메인 시나리오: spec에 박힌 5개 케이스 ────────────────────────
@pytest.mark.parametrize(
    "text, expected",
    [
        ("후라이드 한 마리 주이소", [("fried_one", 1)]),
        ("후치 하나만", [("fried_one", 1)]),
        ("양념 두 마리", [("yangnyeom_one", 2)]),
        ("불고기버거 두 개랑 콜라 하나", [("bulgogi", 2), ("cola", 1)]),
        ("아메리카노 세 잔", [("americano", 3)]),
    ],
)
def test_dialect_inputs(text, expected):
    result = match(text)
    actual = [(m.item_id, m.quantity) for m in result]
    assert actual == expected, f"{text!r}: expected {expected}, got {actual}"


# ── 수량 추출 ────────────────────────────────────────────────────
@pytest.mark.parametrize(
    "segment, expected",
    [
        ("한 마리", 1),
        ("두 개", 2),
        ("세 잔", 3),
        ("네 병", 4),
        ("열 그릇", 10),
        ("한마리", 1),       # 띄어쓰기 없음
        ("3개", 3),          # 아라비아 숫자
        ("콜라 하나", 1),     # 단위 없는 수사
        ("둘 주세요", 2),     # 단위 없는 수사
        ("그냥 주세요", 1),   # 수량 정보 없음 → 기본값
    ],
)
def test_extract_quantity(segment, expected):
    assert extract_quantity(segment) == expected


def test_korean_numeral_table_is_complete():
    # 1~10 모두 어떤 형태로든 표현 가능해야 함
    expressed = set(KOREAN_NUMERALS.values())
    assert expressed >= set(range(1, 11))


# ── 빈 입력 / 잡음 입력 ─────────────────────────────────────────
def test_empty_input_returns_empty():
    assert match("") == []
    assert match("   ") == []


def test_garbage_input_returns_empty():
    # 메뉴 키워드 전혀 없고 fuzzy 임계치 아래
    assert match("오늘 날씨가 참 좋네요 하늘이 맑아요") == []


# ── 단일 세그먼트 / 기본 수량 ────────────────────────────────────
def test_default_quantity_is_one():
    result = match("콜라 주세요")
    assert len(result) == 1
    assert result[0].item_id == "cola"
    assert result[0].quantity == 1


def test_dedupes_same_item_within_input():
    # "치킨 한 마리"는 fried_one/yangnyeom_one/half_half 키워드 일부와 모두 겹치지만
    # 한 세그먼트당 best 하나만 골라 결과에 같은 id가 두 번 들어가지 않아야 함
    result = match("치킨 한 마리")
    ids = [m.item_id for m in result]
    assert len(ids) == len(set(ids))
    assert len(ids) == 1


# ── 다중 항목 분리 ──────────────────────────────────────────────
@pytest.mark.parametrize(
    "text",
    [
        "불고기버거 두 개랑 콜라 하나",
        "불고기버거 두 개하고 콜라 하나",
        "불고기버거 두 개, 콜라 하나",
    ],
)
def test_multiple_items_with_various_connectors(text):
    result = match(text)
    actual = [(m.item_id, m.quantity) for m in result]
    assert actual == [("bulgogi", 2), ("cola", 1)]


# ── Match 데이터 구조 ────────────────────────────────────────────
def test_match_records_segment_and_score():
    [m] = match("아메리카노 세 잔")
    assert m.name == "아메리카노"
    assert m.score == 1.0  # 키워드 직접 매칭
    assert "아메리카노" in m.raw_segment
