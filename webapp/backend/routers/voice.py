"""음성 한 turn API.

POST /api/voice/turn:
  - audio (multipart): 사용자 발화 wav/flac
  - history (form, JSON 문자열): 대화 히스토리 [{role, content}]
  - 반환: { user_text, reply, slots, intent, ready_to_confirm, tts_url }

GET /api/voice/tts?text=... : 텍스트 → mp3 스트림 (프론트 audio 태그가 직접 재생)

설계 노트:
- WebSocket 대신 HTTP POST + GET TTS — Phase 1 단순함 우선.
- VAD/인터럽트는 Phase 2/3에서 WebSocket으로 전환.
"""

from __future__ import annotations

import io
import json
import urllib.parse

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.responses import StreamingResponse

from services.asr import asr_status_detail, transcribe_audio_bytes
from services.llm import chat_turn_for_mode, is_configured as llm_configured
from services.tts import synthesize_mp3

router = APIRouter(prefix="/api/voice", tags=["voice"])


@router.get("/status")
def status():
    """프론트 부팅 시 시스템 상태 표시용."""
    detail = asr_status_detail()
    return {
        **detail,
        # 하위 호환: 기존 필드명 유지
        "asr_backend": detail["asr_backend_class"],
        "llm_configured": llm_configured(),
    }


@router.post("/turn")
async def turn(
    audio: UploadFile = File(...),
    history: str = Form("[]"),
    mode: str = Form("consumer"),
):
    audio_bytes = await audio.read()
    if not audio_bytes:
        raise HTTPException(status_code=400, detail="empty audio")

    try:
        user_text = transcribe_audio_bytes(audio_bytes)
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"ASR 실패: {e}")

    try:
        history_list = json.loads(history) if history else []
        if not isinstance(history_list, list):
            history_list = []
    except json.JSONDecodeError:
        history_list = []

    if not user_text.strip():
        # 인식 결과가 비어있으면 LLM 호출 스킵, 사용자에게 다시 요청
        return {
            "user_text": "",
            "reply": "죄송합니다. 잘 못 들었어요. 다시 한번 말씀해 주시겠어요?",
            "slots": {},
            "intent": "noisy",
            "ready_to_confirm": False,
            "tts_url": _tts_url("죄송합니다. 잘 못 들었어요. 다시 한번 말씀해 주시겠어요?"),
        }

    result = chat_turn_for_mode(user_text, history_list, mode)
    result["user_text"] = user_text
    result["tts_url"] = _tts_url(result["reply"])
    return result


@router.post("/text")
async def text_turn(body: dict):
    """음성 없이 텍스트 입력으로 한 turn — 디버깅·접근성 폴백."""
    user_text = (body.get("user_text") or "").strip()
    history = body.get("history") or []
    if not user_text:
        raise HTTPException(status_code=400, detail="user_text required")
    mode_raw = body.get("mode") or "consumer"
    mode = mode_raw if mode_raw in ("consumer", "seller") else "consumer"
    result = chat_turn_for_mode(user_text, history, mode)
    result["user_text"] = user_text
    result["tts_url"] = _tts_url(result["reply"])
    return result


@router.get("/tts")
def tts(text: str):
    audio = synthesize_mp3(text)
    if audio is None:
        raise HTTPException(status_code=502, detail="TTS 합성 실패")
    return StreamingResponse(
        io.BytesIO(audio),
        media_type="audio/mpeg",
        headers={"Cache-Control": "public, max-age=3600"},
    )


def _tts_url(text: str) -> str:
    return f"/api/voice/tts?text={urllib.parse.quote(text)}"
