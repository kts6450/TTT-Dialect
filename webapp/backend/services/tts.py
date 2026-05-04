"""TTS — gTTS로 mp3 바이트 생성.

운영 환경에서는 더 자연스러운 TTS(Edge TTS, Coqui)로 교체 권장.
"""

from __future__ import annotations

import io


def synthesize_mp3(text: str, lang: str = "ko") -> bytes | None:
    """텍스트 → mp3 바이트. 실패 시 None."""
    if not text or not text.strip():
        return None
    try:
        from gtts import gTTS

        buf = io.BytesIO()
        gTTS(text=text, lang=lang, slow=False).write_to_fp(buf)
        return buf.getvalue()
    except Exception:
        return None
