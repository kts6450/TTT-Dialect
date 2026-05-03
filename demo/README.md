# TTT-Dialect 데모

방언/노인 음성 인식 모델로 만드는 두 가지 데모.

- **`app_kiosk.py`** — 음성으로 메뉴 주문하는 키오스크 (메인)
- **`app_chatbot.py`** — 음성·텍스트로 대화하는 챗봇 (Claude API)

## 설치

```bash
pip install -r demo/requirements.txt
```

## 실행

### 키오스크

```bash
# 학습된 Whisper 체크포인트가 준비되었을 때
set TTT_MODEL_PATH=C:\path\to\checkpoints\combined\best
streamlit run demo/app_kiosk.py

# 모델 도착 전 UI만 검증할 때
set TTT_ASR_BACKEND=dummy
streamlit run demo/app_kiosk.py
```

### 챗봇

```bash
set ANTHROPIC_API_KEY=sk-ant-...
set TTT_MODEL_PATH=C:\path\to\checkpoints\combined\best   # 또는 dummy 백엔드
streamlit run demo/app_chatbot.py
```

## 환경변수

| 변수                  | 용도                                                   | 기본값                  |
| --------------------- | ------------------------------------------------------ | ----------------------- |
| `TTT_MODEL_PATH`      | 학습된 Whisper 체크포인트 디렉토리                     | `openai/whisper-small`  |
| `TTT_ASR_BACKEND`     | `dummy`로 설정하면 Whisper 로딩 스킵 (UI 검증용)       | `whisper`               |
| `ANTHROPIC_API_KEY`   | 챗봇용 Claude API 키 (키오스크에는 불필요)             | (없음)                  |

## 테스트

```bash
python -m pytest demo/tests -v
```

ASR/매처 단위 테스트는 모델 다운로드 없이 통과한다 (`DummyASR` + `difflib` fallback).

## 폴더 구조

```
demo/
├── app_kiosk.py        # Streamlit 키오스크 앱
├── app_chatbot.py      # Streamlit 챗봇 앱
├── asr.py              # Whisper 추론 wrapper (공통)
├── matcher.py          # 메뉴 매칭 로직 (키오스크 전용)
├── llm.py              # Claude API wrapper (챗봇 전용)
├── menu.json           # 가상 메뉴 데이터
├── requirements.txt
├── README.md
└── tests/
    ├── test_asr.py
    └── test_matcher.py
```

## 학습된 모델 swap 절차

학습 서버에서 fine-tune이 끝난 Whisper 체크포인트를 받으면:

1. HuggingFace 표준 저장 디렉토리(`config.json`, `pytorch_model.bin` 또는 `model.safetensors`,
   `tokenizer*`, `preprocessor_config.json` 포함)를 로컬에 복사
2. `set TTT_MODEL_PATH=<디렉토리 경로>`
3. `set TTT_ASR_BACKEND=` 또는 변수 자체를 unset (더미 백엔드 해제)
4. Streamlit 앱 재시작

`get_asr()`이 자동으로 `WhisperASR` 인스턴스를 만들어 학습된 모델을 로드한다 — 코드 변경 없음.

## 개발 메모

- ASR과 LLM은 **느린 import 지연 로딩** — 토치/transformers/anthropic 모듈이 import되지
  않은 채 `asr`/`llm` 모듈을 import할 수 있다. 테스트와 UI 부팅이 빨라진다
- 매처는 **순수 함수** — ASR이나 모델에 의존하지 않는다. 텍스트 in / 매치 out
- 단위 테스트는 **외부 의존 없이 통과** — Whisper 다운로드, sentence-transformers,
  Anthropic API 모두 불필요
- 키워드 매칭이 fuzzy 매칭(`difflib.SequenceMatcher`)보다 항상 우선. 방언 발음 변형은
  키워드를 충분히 등록해서 흡수 — fuzzy fallback은 안전망
- 챗봇 시스템 프롬프트는 `cache_control: ephemeral`을 달아두지만 현재 길이로는 캐싱 임계
  (Sonnet 4.6 기준 2048 토큰)에 못 미쳐 silent no-op이다. 시스템 프롬프트가 길어지면 자동
  활성화됨
