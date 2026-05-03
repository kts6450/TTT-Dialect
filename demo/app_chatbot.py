"""
TTT-Dialect 챗봇 데모.

음성 또는 텍스트로 한국 어르신과 대화하는 비서. 음성 입력은 학습된
Whisper로 받아 적고 Claude(claude-sonnet-4-6)가 답한다. 답변은
선택적으로 gTTS로 들려준다.

실행:
    set ANTHROPIC_API_KEY=sk-ant-...
    streamlit run demo/app_chatbot.py
"""

from __future__ import annotations

import io
import sys
from pathlib import Path

import numpy as np
import soundfile as sf
import streamlit as st

sys.path.insert(0, str(Path(__file__).resolve().parent))

from asr import get_asr  # noqa: E402
from llm import chat, is_configured  # noqa: E402

st.set_page_config(
    page_title="음성 챗봇",
    page_icon="💬",
    layout="centered",
)

# ── 노인 친화 CSS — 큰 글씨 + 큰 버튼 ────────────────────────────
st.markdown(
    """
<style>
  html, body, [data-testid="stAppViewContainer"] { font-size: 20px; }
  h1 { font-size: 2.6rem !important; font-weight: 800 !important; }
  h2 { font-size: 1.8rem !important; }
  .stButton button {
    font-size: 1.2rem !important;
    padding: 0.7rem 1.2rem !important;
    border-radius: 10px !important;
    min-height: 56px;
  }
  [data-testid="stChatMessage"] {
    font-size: 1.2rem;
    padding: 0.8rem 1rem;
  }
  .stChatInput textarea {
    font-size: 1.2rem !important;
  }
  .api-warn {
    background: #fff3e0;
    border-left: 6px solid #ff9800;
    padding: 1rem 1.2rem;
    border-radius: 8px;
    font-size: 1.1rem;
    margin-bottom: 1rem;
  }
</style>
""",
    unsafe_allow_html=True,
)


# ── 헬퍼 ─────────────────────────────────────────────────────
def _decode_audio(audio_bytes: bytes) -> tuple[np.ndarray, int]:
    audio_np, sr = sf.read(io.BytesIO(audio_bytes), dtype="float32")
    if audio_np.ndim > 1:
        audio_np = audio_np.mean(axis=1)
    return audio_np.astype(np.float32), int(sr)


def _tts_bytes(text: str, lang: str = "ko") -> bytes | None:
    """gTTS로 mp3 바이트 생성. 네트워크/패키지 오류는 None으로 흡수."""
    if not text.strip():
        return None
    try:
        from gtts import gTTS

        buf = io.BytesIO()
        gTTS(text=text, lang=lang).write_to_fp(buf)
        return buf.getvalue()
    except Exception:
        return None


@st.cache_resource(show_spinner="음성 인식 모델 준비 중...")
def _asr_backend():
    return get_asr()


# ── 메인 ─────────────────────────────────────────────────────
def main():
    asr = _asr_backend()

    st.session_state.setdefault("chat_history", [])  # [{role, content, audio?}]
    st.session_state.setdefault("chat_audio_id", None)

    # ── 사이드바 ──────────────────────────────────────────
    with st.sidebar:
        st.markdown("### 설정")

        backend_name = type(asr).__name__
        if backend_name == "DummyASR":
            st.warning("음성 인식: **더미** (UI 검증용)")
        else:
            st.success("음성 인식: **Whisper**")
            st.caption(f"모델: `{getattr(asr, 'model_path', '?')}`")

        if is_configured():
            st.success("Claude API: **연결됨**")
        else:
            st.error("Claude API: **키 없음**")

        st.divider()
        tts_on = st.toggle("음성으로 답해주기 (TTS)", value=False)

        st.divider()
        if st.button("🗑️ 대화 초기화", use_container_width=True):
            st.session_state.chat_history = []
            st.session_state.chat_audio_id = None
            st.rerun()

    # ── 헤더 ──────────────────────────────────────────────
    st.markdown("# 💬 음성 챗봇")
    st.caption("음성 또는 텍스트로 편하게 말씀해 주세요.")

    if not is_configured():
        st.markdown(
            "<div class='api-warn'>⚠️ ANTHROPIC_API_KEY 환경변수가 설정되지 않아 "
            "답변을 받을 수 없습니다. 키 설정 후 앱을 재시작해 주세요.</div>",
            unsafe_allow_html=True,
        )

    # ── 대화 히스토리 표시 ─────────────────────────────────
    for msg in st.session_state.chat_history:
        with st.chat_message(msg["role"]):
            st.markdown(msg["content"])
            audio = msg.get("audio")
            if audio and tts_on:
                st.audio(audio, format="audio/mp3")

    # ── 입력: 음성 또는 텍스트 ─────────────────────────────
    st.divider()
    st.markdown("##### 🎙️ 음성으로 말하기")
    audio_file = st.audio_input("마이크 버튼", key="chatbot_mic", label_visibility="collapsed")

    text_input = st.chat_input("또는 여기에 입력하세요")

    user_text: str | None = None

    if text_input:
        user_text = text_input.strip()
    elif audio_file is not None:
        audio_bytes = audio_file.getvalue()
        audio_id = hash(audio_bytes)
        if st.session_state.chat_audio_id != audio_id:
            with st.spinner("음성 인식 중..."):
                audio_np, sr = _decode_audio(audio_bytes)
                user_text = (asr.transcribe(audio_np, sr=sr) or "").strip()
            st.session_state.chat_audio_id = audio_id
            if not user_text:
                st.warning("말씀을 알아듣지 못했어요. 다시 한번 말씀해 주세요.")

    # ── LLM 호출 ──────────────────────────────────────────
    if user_text:
        st.session_state.chat_history.append({"role": "user", "content": user_text})

        api_history = [
            {"role": m["role"], "content": m["content"]}
            for m in st.session_state.chat_history
        ]

        try:
            with st.spinner("답변을 생각하고 있어요..."):
                reply = chat(api_history)
        except Exception as e:
            st.error(f"답변 생성에 실패했어요: {e}")
            # 실패한 user 메시지 롤백 — 다음 turn 때 prefix가 깨지지 않게
            st.session_state.chat_history.pop()
            return

        assistant_msg: dict = {"role": "assistant", "content": reply}
        if tts_on:
            audio = _tts_bytes(reply)
            if audio is not None:
                assistant_msg["audio"] = audio
        st.session_state.chat_history.append(assistant_msg)
        st.rerun()


if __name__ == "__main__":
    main()
