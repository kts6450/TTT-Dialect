"""LLM 서비스 — Hades 음성 비서 페르소나.

Claude API(claude-sonnet-4-6) + 카탈로그 컨텍스트 주입 + 슬롯/인텐트 추출.
시스템 프롬프트에 ephemeral cache 마커 — 카탈로그가 길어지면 자연스럽게 캐시.
"""

from __future__ import annotations

import json
import os
import re
from functools import lru_cache

import anthropic

from services.catalog import catalog_summary_for_llm

DEFAULT_MODEL = "claude-sonnet-4-6"
MAX_TOKENS = 1024


def _build_system_prompt() -> str:
    return f"""\
당신은 'Hades'라는 이름의 음성 비서입니다. 한국 어르신(60대 이상)이 음성으로
체험 활동을 예약할 수 있도록 도와줍니다. 사용자는 방언(경상/전라/충청/강원/제주)을
쓸 수 있고, 발화가 짧거나 어순이 자유롭습니다.

## 답변 원칙
- 짧고 명료하게. 한 번에 1~2 문장이면 충분합니다.
- 따뜻하고 정중한 어조. "~십니다", "~예요" 정도로.
- 어려운 외래어/전문용어 피하고 쉬운 우리말로.
- 사용자가 방언으로 말해도 자연스럽게 이해하고 표준어로 답하세요. 표현을
  교정하지 말고 의미만 받아들이세요.
- 음성 인식 결과가 어색해도 가장 그럴듯한 의미로 받아들이고 답하세요.
  인식 오류 자체를 지적하지 마세요.
- 답변은 음성으로 들려질 수 있으니 글머리 기호/마크다운/이모지/영어 단어를
  쓰지 마세요. 자연스러운 한국어 문장으로만.

## 진행 방식
다음 슬롯을 자연스럽게 채워가세요:
1. experience_id (어떤 체험)
2. date (날짜 — "내일", "다음 주 토요일" 같은 상대 표현은 절대 날짜로 변환)
3. time (시간 — "오후 2시" 등)
4. headcount (인원)
5. contact_name (예약자 이름)
6. contact_phone (연락처)

이미 채워진 슬롯은 다시 묻지 말고, 비어 있는 슬롯 중 하나만 한 번에 물어보세요.
모든 슬롯이 채워지면 "확인" 단계로 넘어가서, "○○ 체험 / ○월 ○일 ○시 / ○명 /
○○○ 님 / 010-XXXX-XXXX 로 예약하시겠습니까?"처럼 정리해서 다시 물어보세요.

## 체험 카탈로그 (참고)
사용자가 자유 발화로 말해도 아래 카탈로그에서 가장 가까운 체험을 추론하세요.
카탈로그에 없는 체험을 요청하면 솔직하게 없다고 말하고 비슷한 다른 체험을 추천하세요.

{catalog_summary_for_llm()}
"""


def is_configured() -> bool:
    return bool(os.environ.get("ANTHROPIC_API_KEY"))


@lru_cache(maxsize=1)
def _client() -> anthropic.Anthropic:
    if not is_configured():
        raise RuntimeError(
            "ANTHROPIC_API_KEY 환경변수가 설정되지 않았습니다. "
            "https://console.anthropic.com 에서 키 발급 후 등록하세요."
        )
    return anthropic.Anthropic()


def chat_turn(user_text: str, history: list[dict]) -> dict:
    """단일 사용자 발화 → 모델 응답 + 추출된 슬롯/인텐트.

    history: [{"role": "user"|"assistant", "content": "..."}]
    반환: {"reply": str, "slots": dict, "intent": str, "ready_to_confirm": bool}
    """
    if not is_configured():
        return {
            "reply": "죄송합니다. 시스템에 잠시 문제가 있어요. 잠시 후 다시 시도해 주세요.",
            "slots": {},
            "intent": "error",
            "ready_to_confirm": False,
            "error": "ANTHROPIC_API_KEY missing",
        }

    client = _client()
    messages = list(history) + [{"role": "user", "content": user_text}]

    response = client.messages.create(
        model=DEFAULT_MODEL,
        max_tokens=MAX_TOKENS,
        system=[
            {
                "type": "text",
                "text": _build_system_prompt(),
                "cache_control": {"type": "ephemeral"},
            }
        ],
        messages=messages,
        thinking={"type": "disabled"},
        output_config={"effort": "low"},
    )
    reply = next(b.text for b in response.content if b.type == "text").strip()

    # 슬롯 추출은 별도 Claude 호출 (low effort, 짧음)
    slots, intent, ready = _extract_slots(messages + [{"role": "assistant", "content": reply}])

    return {
        "reply": reply,
        "slots": slots,
        "intent": intent,
        "ready_to_confirm": ready,
    }


_SLOT_SCHEMA = {
    "type": "object",
    "properties": {
        "intent": {
            "type": "string",
            "enum": ["browse", "reserve", "modify", "cancel", "ask_info", "confirm", "smalltalk", "other"],
        },
        "experience_id": {"type": ["string", "null"]},
        "date": {"type": ["string", "null"], "description": "ISO 8601 (YYYY-MM-DD)"},
        "time": {"type": ["string", "null"], "description": "HH:MM"},
        "headcount": {"type": ["integer", "null"]},
        "contact_name": {"type": ["string", "null"]},
        "contact_phone": {"type": ["string", "null"]},
        "ready_to_confirm": {"type": "boolean"},
    },
    "required": ["intent", "ready_to_confirm"],
    "additionalProperties": False,
}


def _extract_slots(conversation: list[dict]) -> tuple[dict, str, bool]:
    """대화 전체에서 현재까지 채워진 슬롯과 의도 추출."""
    client = _client()
    extractor_prompt = """\
아래 대화를 분석해 사용자가 원하는 예약 정보를 슬롯으로 추출하세요.
대화에 명시되지 않은 슬롯은 null로 두세요. ready_to_confirm은 모든 슬롯
(experience_id, date, time, headcount, contact_name, contact_phone)이
다 채워졌고 사용자가 확정 의사를 보였을 때만 true.
"""
    try:
        response = client.messages.create(
            model=DEFAULT_MODEL,
            max_tokens=512,
            system=extractor_prompt,
            messages=[
                {
                    "role": "user",
                    "content": "대화:\n"
                    + "\n".join(f"[{m['role']}] {m['content']}" for m in conversation),
                }
            ],
            thinking={"type": "disabled"},
            output_config={
                "effort": "low",
                "format": {"type": "json_schema", "schema": _SLOT_SCHEMA},
            },
        )
        text = next(b.text for b in response.content if b.type == "text")
        data = json.loads(text)
        intent = data.pop("intent", "other")
        ready = data.pop("ready_to_confirm", False)
        # null 값은 dict에서 제거
        slots = {k: v for k, v in data.items() if v is not None}
        return slots, intent, bool(ready)
    except Exception:
        # 슬롯 추출 실패해도 chat 자체는 실패시키지 않음
        return {}, "other", False
