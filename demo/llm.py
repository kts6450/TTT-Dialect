"""
챗봇용 Claude API 래퍼.

claude-sonnet-4-6 + 시스템 프롬프트 ephemeral 캐싱 + thinking 비활성 +
effort low 로 호출한다 (어르신 대상 음성 챗봇 — 짧고 빠른 응답이 우선).

`ANTHROPIC_API_KEY` 환경변수 필요. 모듈 import 시점에는 검증하지 않고
`chat()`을 처음 부를 때 친절한 메시지로 알린다 — Streamlit 첫 화면이
환경변수 미설정으로 죽지 않게.
"""

from __future__ import annotations

import os
from functools import lru_cache

import anthropic

DEFAULT_MODEL = "claude-sonnet-4-6"
DEFAULT_MAX_TOKENS = 1024

SYSTEM_PROMPT = """\
당신은 한국 어르신 사용자를 위한 친근한 음성 비서입니다.
다음 원칙을 지켜서 답하세요.

- 짧고 명료하게. 보통은 한두 문장이면 충분합니다.
- 어려운 외래어와 전문용어 대신 쉬운 우리말로 풀어 말하세요.
- 사용자가 방언(경상도/전라도/충청도/강원도/제주도)으로 말해도
  자연스럽게 이해하고 표준어로 친절하게 답하세요. 표현을 교정하지
  말고 의미만 받아들이세요.
- 음성 인식 결과가 어색하거나 단어가 애매할 때는 가장 그럴듯한 뜻으로
  받아들이고 답하세요. 인식 오류 자체를 지적하지 마세요.
- 따뜻하고 친근한 어조로, 하지만 과한 추임새는 빼세요.
- 의료/법률/금융처럼 전문가 판단이 필요한 질문은 단정하지 말고
  전문가나 가족과 상의하시도록 안내하세요.
- 답변은 음성으로 들려질 수 있으니 글머리 기호, 마크다운, 영어 단어,
  이모지를 가급적 쓰지 마세요. 자연스러운 한국어 문장으로 답하세요.
"""


def is_configured() -> bool:
    """API 키가 환경변수에 있는지 확인 (네트워크 호출 X)."""
    return bool(os.environ.get("ANTHROPIC_API_KEY"))


@lru_cache(maxsize=1)
def _client() -> anthropic.Anthropic:
    if not is_configured():
        raise RuntimeError(
            "ANTHROPIC_API_KEY 환경변수가 설정되지 않았습니다.\n"
            "https://console.anthropic.com 에서 키 발급 후\n"
            "  set ANTHROPIC_API_KEY=sk-ant-...\n"
            "로 설정하고 Streamlit을 재시작해 주세요."
        )
    return anthropic.Anthropic()


def chat(
    messages: list[dict],
    *,
    model: str = DEFAULT_MODEL,
    system: str = SYSTEM_PROMPT,
    max_tokens: int = DEFAULT_MAX_TOKENS,
) -> str:
    """단일 turn 호출. 호출 측이 history를 관리한다.

    `messages`는 ``[{"role": "user"|"assistant", "content": "..."}]`` 형식.
    마지막 메시지는 반드시 ``"user"`` 여야 한다.
    """
    if not messages:
        raise ValueError("messages 가 비어 있습니다.")
    if messages[-1].get("role") != "user":
        raise ValueError("마지막 메시지는 user 여야 합니다.")

    client = _client()
    response = client.messages.create(
        model=model,
        max_tokens=max_tokens,
        system=[
            {
                "type": "text",
                "text": system,
                "cache_control": {"type": "ephemeral"},
            }
        ],
        messages=messages,
        thinking={"type": "disabled"},
        output_config={"effort": "low"},
    )
    return next(
        block.text for block in response.content if block.type == "text"
    ).strip()
