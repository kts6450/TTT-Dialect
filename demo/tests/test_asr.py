"""ASR wrapper 단위 테스트.

Whisper 체크포인트 다운로드 없이 통과하도록 DummyASR과 헬퍼만 검증한다.
"""

from __future__ import annotations

import sys
from pathlib import Path

import numpy as np
import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from asr import (  # noqa: E402
    TARGET_SR,
    DummyASR,
    _resample_if_needed,
    _to_mono,
    get_asr,
)


def test_to_mono_keeps_1d_audio():
    audio = np.array([0.1, -0.2, 0.3], dtype=np.float32)
    out = _to_mono(audio)
    assert out.ndim == 1
    np.testing.assert_array_equal(out, audio)


def test_to_mono_averages_stereo_channels():
    stereo = np.stack([np.ones(50), np.zeros(50)], axis=1)
    out = _to_mono(stereo)
    assert out.ndim == 1
    np.testing.assert_allclose(out, np.full(50, 0.5))


def test_resample_identity_when_already_target_sr():
    audio = np.linspace(-1.0, 1.0, TARGET_SR, dtype=np.float32)
    out = _resample_if_needed(audio, TARGET_SR)
    assert out.shape == audio.shape
    np.testing.assert_array_equal(out, audio)


def test_resample_changes_length_for_other_sr():
    pytest.importorskip("librosa")
    audio = np.zeros(8000, dtype=np.float32)
    out = _resample_if_needed(audio, sr=8000)
    assert out.shape[0] == TARGET_SR  # 8k → 16k 업샘플


def test_dummy_asr_returns_fixed_text():
    asr = DummyASR(fixed_text="치킨 한 마리")
    audio = np.zeros(8000, dtype=np.float32)
    assert asr.transcribe(audio, sr=16000) == "치킨 한 마리"


def test_dummy_asr_records_call_metadata():
    asr = DummyASR()
    asr.transcribe(np.zeros(4321, dtype=np.float32), sr=22050)
    assert asr.calls == [(4321, 22050)]


def test_dummy_asr_handles_stereo_input():
    asr = DummyASR()
    stereo = np.zeros((2000, 2), dtype=np.float32)
    asr.transcribe(stereo, sr=16000)
    # mono 변환 후 길이가 그대로(2000)여야 한다
    assert asr.calls[-1] == (2000, 16000)


def test_get_asr_returns_dummy_when_env_set(monkeypatch):
    get_asr.cache_clear()
    monkeypatch.setenv("TTT_ASR_BACKEND", "dummy")
    backend = get_asr()
    try:
        assert isinstance(backend, DummyASR)
    finally:
        get_asr.cache_clear()


def test_get_asr_is_cached(monkeypatch):
    get_asr.cache_clear()
    monkeypatch.setenv("TTT_ASR_BACKEND", "dummy")
    try:
        a = get_asr()
        b = get_asr()
        assert a is b
    finally:
        get_asr.cache_clear()
