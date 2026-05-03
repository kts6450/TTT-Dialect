"""
TTT-Dialect 키오스크 데모 (메인).

노인+방언 사용자가 마이크에 메뉴를 말하면 ASR이 텍스트로 옮기고
matcher가 메뉴 ID/수량으로 변환해 주문서를 보여준다.

실행:
    streamlit run demo/app_kiosk.py

ASR 백엔드:
    TTT_MODEL_PATH=<dir>            학습된 Whisper 체크포인트 디렉토리
    TTT_ASR_BACKEND=dummy           모델 없이 UI plumbing만 검증할 때
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
from matcher import Match, load_menu, match  # noqa: E402

st.set_page_config(
    page_title="음성 키오스크",
    page_icon="🍔",
    layout="wide",
)

# ── 노인 친화 CSS — 큰 글씨, 강한 대비, 큼직한 버튼 ─────────────
st.markdown(
    """
<style>
  html, body, [data-testid="stAppViewContainer"] { font-size: 22px; }
  h1 { font-size: 3rem !important; font-weight: 800 !important; }
  h2 { font-size: 2rem !important; font-weight: 700 !important; }
  h3 { font-size: 1.6rem !important; }
  .stButton button {
    font-size: 1.4rem !important;
    padding: 1rem 1.5rem !important;
    border-radius: 12px !important;
    font-weight: 700 !important;
    width: 100%;
    min-height: 64px;
  }
  .order-line {
    font-size: 1.6rem;
    padding: 0.8rem 1rem;
    background: #fff8e1;
    border-radius: 10px;
    margin-bottom: 0.6rem;
    border-left: 8px solid #ff9800;
  }
  .total-line {
    font-size: 2.2rem;
    font-weight: 800;
    color: #c62828;
    padding: 0.8rem 1rem;
    border-top: 3px solid #c62828;
    margin-top: 1rem;
  }
  .recognized {
    background: #e3f2fd;
    border-radius: 10px;
    padding: 1rem 1.2rem;
    font-size: 1.4rem;
    margin-bottom: 1rem;
  }
  .error {
    background: #ffebee;
    color: #b71c1c;
    border-radius: 10px;
    padding: 1rem 1.2rem;
    font-size: 1.5rem;
    font-weight: 700;
    margin-bottom: 1rem;
  }
  .status-pill {
    display: inline-block;
    padding: 0.3rem 0.9rem;
    border-radius: 999px;
    font-size: 1.1rem;
    font-weight: 700;
    background: #f1f3f5;
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


def _format_won(amount: int) -> str:
    return f"{amount:,}원"


def _menu_lookup(menu: dict) -> dict[str, dict]:
    return {it["id"]: it for cat in menu["categories"] for it in cat["items"]}


def _order_total(order: list[Match], items_by_id: dict[str, dict]) -> int:
    return sum(items_by_id[m.item_id]["price"] * m.quantity for m in order)


@st.cache_resource(show_spinner="음성 인식 모델 준비 중...")
def _asr_backend():
    return get_asr()


@st.cache_resource
def _menu_data():
    return load_menu()


def _reset_kiosk_state():
    for k in [
        "kiosk_audio_id",
        "kiosk_last_text",
        "kiosk_order",
        "kiosk_status",
    ]:
        st.session_state.pop(k, None)


# ── 메인 ─────────────────────────────────────────────────────
def main():
    asr = _asr_backend()
    menu = _menu_data()
    items_by_id = _menu_lookup(menu)

    st.session_state.setdefault("kiosk_audio_id", None)
    st.session_state.setdefault("kiosk_last_text", "")
    st.session_state.setdefault("kiosk_order", [])
    st.session_state.setdefault("kiosk_status", "ready")

    # ── 사이드바 ───────────────────────────────────────────
    with st.sidebar:
        st.markdown("### 시스템 상태")
        backend_name = type(asr).__name__
        if backend_name == "DummyASR":
            st.warning("음성 인식: **더미 백엔드**\n(UI 검증용 — 실제 인식 X)")
        else:
            st.success("음성 인식: **Whisper**")
            st.caption(f"모델: `{getattr(asr, 'model_path', '?')}`")

        st.divider()
        st.markdown("### 메뉴")
        for cat in menu["categories"]:
            with st.expander(cat["name"], expanded=True):
                for it in cat["items"]:
                    st.markdown(f"- **{it['name']}** — {_format_won(it['price'])}")

    # ── 헤더 ──────────────────────────────────────────────
    st.markdown("# 🍔 음성 키오스크")
    st.markdown("### 마이크 버튼을 누르고 메뉴를 말씀해 주세요")
    st.caption('예시: "후라이드 한 마리하고 콜라 하나 주이소"')

    col_left, col_right = st.columns([1, 1], gap="large")

    # ── 왼쪽: 음성 입력 ─────────────────────────────────────
    with col_left:
        st.markdown("## 🎙️ 1. 주문 말하기")
        audio_file = st.audio_input("마이크 버튼을 눌러 녹음", key="kiosk_mic")

        if audio_file is not None:
            audio_bytes = audio_file.getvalue()
            audio_id = hash(audio_bytes)
            # 같은 녹음을 재처리하지 않음 — 버튼 클릭 reruns 시 ASR 재호출 방지
            if st.session_state.kiosk_audio_id != audio_id:
                with st.spinner("음성을 글로 바꾸는 중..."):
                    audio_np, sr = _decode_audio(audio_bytes)
                    text = asr.transcribe(audio_np, sr=sr)
                st.session_state.kiosk_audio_id = audio_id
                st.session_state.kiosk_last_text = text or ""
                matches = match(text or "")
                st.session_state.kiosk_order = list(matches)
                st.session_state.kiosk_status = "confirm" if matches else "failed"

        if st.session_state.kiosk_last_text:
            st.markdown(
                f"<div class='recognized'>📝 인식된 말<br/>"
                f"<b>{st.session_state.kiosk_last_text}</b></div>",
                unsafe_allow_html=True,
            )

        if st.session_state.kiosk_status == "failed":
            st.markdown(
                "<div class='error'>죄송해요, 다시 한번 말씀해 주세요.</div>",
                unsafe_allow_html=True,
            )

    # ── 오른쪽: 주문 확인 ──────────────────────────────────
    with col_right:
        st.markdown("## 🧾 2. 주문 확인")
        order: list[Match] = st.session_state.kiosk_order

        if not order:
            st.info("아직 주문이 없어요. 왼쪽에서 말씀해 주세요.")
        else:
            for m in order:
                item = items_by_id[m.item_id]
                line_total = item["price"] * m.quantity
                st.markdown(
                    f"<div class='order-line'>{item['name']} &nbsp;×&nbsp; {m.quantity}"
                    f"&nbsp;&nbsp;<b style='float:right'>{_format_won(line_total)}</b></div>",
                    unsafe_allow_html=True,
                )
            total = _order_total(order, items_by_id)
            st.markdown(
                f"<div class='total-line'>합계 &nbsp; {_format_won(total)}</div>",
                unsafe_allow_html=True,
            )

            c_ok, c_cancel = st.columns(2)
            if c_ok.button("✅ 주문 확정", type="primary", key="kiosk_confirm"):
                st.session_state.kiosk_status = "done"
                st.balloons()
                st.rerun()
            if c_cancel.button("↩️ 처음부터 다시", key="kiosk_reset"):
                _reset_kiosk_state()
                st.rerun()

        if st.session_state.kiosk_status == "done":
            st.success(
                "🎉 주문이 접수되었습니다.\n\n"
                "잠시만 기다려 주시면 호출해 드리겠습니다."
            )


if __name__ == "__main__":
    main()
