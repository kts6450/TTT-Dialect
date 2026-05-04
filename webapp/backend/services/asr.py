"""ASR 서비스 — demo/asr.py를 webapp 컨텍스트에서 재사용.

학습된 Whisper 모델 swap은 동일하게 TTT_MODEL_PATH 환경변수로.
TTT_ASR_BACKEND=dummy 면 더미 백엔드 (UI 검증용).
"""

from __future__ import annotations

import io
import sys
from pathlib import Path

import numpy as np
import soundfile as sf

# demo/ 경로를 import path에 추가 — 한 군데서 ASR 코드 관리
_DEMO_DIR = Path(__file__).resolve().parent.parent.parent.parent / "demo"
if str(_DEMO_DIR) not in sys.path:
    sys.path.insert(0, str(_DEMO_DIR))

from asr import TARGET_SR, get_asr  # noqa: E402  type: ignore


def transcribe_audio_bytes(audio_bytes: bytes) -> str:
    """업로드된 오디오 바이트(WebM/Opus, WAV 등) → 한국어 텍스트.

    soundfile이 디코드 가능한 포맷만 지원. WebM/Opus는 현재 환경에서 디코드
    안 될 수 있으니 프론트엔드에서 가능하면 WAV/PCM으로 보내거나, 백엔드에
    ffmpeg를 추가로 깔아 변환할 것 (Phase 2).
    """
    try:
        audio_np, sr = sf.read(io.BytesIO(audio_bytes), dtype="float32")
    except Exception as e:
        raise RuntimeError(
            f"오디오 디코드 실패: {e}. WAV 또는 FLAC으로 보내거나 ffmpeg 추가 필요."
        ) from e

    if audio_np.ndim > 1:
        audio_np = audio_np.mean(axis=1)
    asr = get_asr()
    return asr.transcribe(audio_np.astype(np.float32), sr=int(sr))


def asr_backend_label() -> str:
    """현재 ASR 백엔드 식별자 (UI 표시용)."""
    asr = get_asr()
    return type(asr).__name__
