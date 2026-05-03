"""
TTT-Dialect 데모용 Whisper ASR 래퍼.

`TTT_MODEL_PATH` 환경변수로 학습된 Whisper 체크포인트 디렉토리를 가리키면
그 모델을 로드하고, 비어있으면 `openai/whisper-small`로 폴백한다.
키오스크/챗봇 양쪽에서 공통으로 import 해서 사용한다.

테스트와 모델 다운로드 전 UI 개발용으로 `DummyASR`을 함께 제공한다.
`TTT_ASR_BACKEND=dummy` 로 두면 `get_asr()`가 더미를 반환한다.
"""

from __future__ import annotations

import os
from functools import lru_cache
from typing import Protocol

import numpy as np

DEFAULT_MODEL = "openai/whisper-small"
TARGET_SR = 16_000
MAX_NEW_TOKENS = 225


class ASRBackend(Protocol):
    def transcribe(self, audio: np.ndarray, sr: int = TARGET_SR) -> str: ...


def _to_mono(audio: np.ndarray) -> np.ndarray:
    audio = np.asarray(audio, dtype=np.float32)
    if audio.ndim > 1:
        audio = audio.mean(axis=1)
    return audio


def _resample_if_needed(audio: np.ndarray, sr: int) -> np.ndarray:
    """모노 변환 후 16kHz로 맞춘다. 이미 16kHz면 그대로 반환."""
    audio = _to_mono(audio)
    if sr == TARGET_SR:
        return audio
    import librosa  # heavy dep, defer until actually resampling
    return librosa.resample(audio, orig_sr=sr, target_sr=TARGET_SR).astype(np.float32)


class WhisperASR:
    """HuggingFace Whisper 체크포인트 추론 래퍼."""

    def __init__(self, model_path: str | None = None, device: str | None = None):
        import torch
        from transformers import WhisperForConditionalGeneration, WhisperProcessor

        path = model_path or os.environ.get("TTT_MODEL_PATH", DEFAULT_MODEL)
        self.device = device or ("cuda" if torch.cuda.is_available() else "cpu")
        self.processor = WhisperProcessor.from_pretrained(path)
        self.model = WhisperForConditionalGeneration.from_pretrained(path).to(self.device)
        self.model.eval()
        self.forced_decoder_ids = self.processor.get_decoder_prompt_ids(
            language="ko", task="transcribe"
        )
        self._torch = torch
        self.model_path = path

    def transcribe(self, audio: np.ndarray, sr: int = TARGET_SR) -> str:
        torch = self._torch
        audio_np = _resample_if_needed(audio, sr)
        feat = self.processor.feature_extractor(
            audio_np,
            sampling_rate=TARGET_SR,
            return_tensors="pt",
        ).input_features.to(self.device)
        with torch.no_grad():
            ids = self.model.generate(
                feat,
                forced_decoder_ids=self.forced_decoder_ids,
                max_new_tokens=MAX_NEW_TOKENS,
            )
        return self.processor.batch_decode(ids, skip_special_tokens=True)[0].strip()


class DummyASR:
    """테스트와 모델 도착 전 UI 시연용 결정론적 백엔드."""

    def __init__(self, fixed_text: str = "더미 인식 결과"):
        self.fixed_text = fixed_text
        self.calls: list[tuple[int, int]] = []  # (length, sr)

    def transcribe(self, audio: np.ndarray, sr: int = TARGET_SR) -> str:
        audio = _to_mono(audio)
        self.calls.append((int(audio.shape[0]), int(sr)))
        return self.fixed_text


@lru_cache(maxsize=1)
def get_asr() -> ASRBackend:
    """프로세스 단위 싱글톤 ASR 백엔드.

    `TTT_ASR_BACKEND=dummy` 가 설정되면 Whisper 로딩을 스킵하고 DummyASR을 반환한다.
    UI plumbing을 모델 없이 미리 검증할 때 사용.
    """
    backend = os.environ.get("TTT_ASR_BACKEND", "whisper").lower()
    if backend == "dummy":
        return DummyASR()
    return WhisperASR()
