# TTT × 노인·방언 음성 인식 개인 적응

> **Test-Time Training**으로 각 노인의 발화 패턴에 실시간 적응해 인식률을 대폭 높인다.

---

## 프로젝트 개요

기존 STT(네이버 클로바, 카카오 등)는 표준어·청년층에 최적화되어 있어  
**노인 + 방언 조합** 인식률이 40~50%대에 머뭅니다.

이 프로젝트는 **TTT(Test-Time Training)** 기법을 적용해  
사용자가 앱을 사용하는 시점에 해당 노인의 발화 패턴으로 모델을 실시간 적응시킵니다.

| 항목 | 내용 |
|------|------|
| 기반 모델 | OpenAI Whisper (small/medium) |
| 초기 학습 | AI Hub 방언·노인 음성 데이터 fine-tuning |
| 핵심 기술 | TTT — 추론 시점에 사용자 발화로 상위 레이어 업데이트 |
| 데모 | Streamlit 실시간 마이크 인식 + 수정 → 추가 학습 |
| 평가 | WER/CER, 방언별·연령대별 히트맵 |

---

## 프로젝트 구조

```
TTT/
├── configs/
│   └── config.yaml          # 전체 설정 (모델, 학습, 데이터 경로)
├── data/
│   ├── preprocess.py        # AI Hub 데이터 전처리 (정규화·무음 제거)
│   └── dataset.py           # PyTorch Dataset / DataLoader / 캘리브레이션 문장
├── models/
│   ├── base_whisper.py      # Whisper 래퍼 (로드·저장·레이어 동결)
│   └── ttt_adapter.py       # TTT 핵심 — 캘리브레이션·지속 적응·프로파일 관리
├── train/
│   └── finetune.py          # AI Hub 데이터 초기 파인튜닝
├── evaluation/
│   ├── metrics.py           # WER/CER, 방언별·연령대별 분석
│   └── evaluate.py          # TTT 전·후 벤치마크 + 시각화
├── app/
│   └── demo.py              # Streamlit TTT 캘리브레이션 데모
├── demo/                    # 키오스크 + 챗봇 데모 (학습된 모델 사용)
│   ├── app_kiosk.py         #   - 음성으로 메뉴 주문 (메인 데모)
│   ├── app_chatbot.py       #   - 음성·텍스트 챗봇 (Claude API)
│   ├── asr.py               #   - Whisper 추론 wrapper (TTT_MODEL_PATH)
│   ├── matcher.py           #   - 메뉴 매칭 (키워드 + fuzzy + 수량 추출)
│   ├── llm.py               #   - Claude API wrapper (claude-sonnet-4-6)
│   ├── menu.json            #   - 가상 메뉴 데이터
│   ├── tests/               #   - 단위 테스트 (모델 의존성 없이 통과)
│   └── README.md            #   - 데모 실행 방법 + 모델 swap 절차
├── scripts/
│   ├── download_data.py     # AI Hub 다운로드 가이드 + KSS 샘플
│   └── quick_test.py        # 데이터 없이 TTT 기능 즉시 검증
└── requirements.txt
```

---

## 빠른 시작

### 1. 환경 설정

```bash
python -m venv .venv
.venv\Scripts\activate      # Windows
pip install -r requirements.txt
```

### 2. 즉시 기능 검증 (데이터 불필요)

```bash
python scripts/quick_test.py
```

### 3. KSS 소규모 샘플 다운로드 (HuggingFace, 즉시 가능)

```bash
python scripts/download_data.py --kss-sample
```

### 4. Streamlit 데모 실행

```bash
# (a) TTT 캘리브레이션 데모 — 사용자 목소리에 실시간 적응
streamlit run app/demo.py

# (b) 키오스크 데모 — 음성으로 메뉴 주문 (메인)
streamlit run demo/app_kiosk.py

# (c) 챗봇 데모 — Claude API 기반 음성/텍스트 대화
set ANTHROPIC_API_KEY=sk-ant-...
streamlit run demo/app_chatbot.py
```

브라우저에서 `http://localhost:8501` 접속.
키오스크/챗봇 상세 실행 옵션과 환경변수는 `demo/README.md` 참고.

---

## 키오스크·챗봇 데모

**메인 시연 시나리오:** 방언 쓰는 노인이 음성으로 메뉴를 주문하면
키오스크가 알아듣고 화면에 주문서를 띄운다.

- `demo/app_kiosk.py` — 학습된 Whisper로 음성 인식 → 메뉴 매칭(키워드+fuzzy)
  → 큰 글씨 주문서 + 확인/취소 버튼. 노인 친화 UI (24pt+, 강한 대비, 64px 버튼).
- `demo/app_chatbot.py` — Claude API(`claude-sonnet-4-6`) 기반 일반 대화 비서.
  음성·텍스트 입력 모두 지원, 답변 TTS 옵션(gTTS).

**모델 도착 전후 swap:** `TTT_MODEL_PATH` 환경변수로 학습된 체크포인트를
가리키면 자동으로 학습된 모델 사용. 변수 미설정 시 `openai/whisper-small`로
폴백, `TTT_ASR_BACKEND=dummy`로 두면 모델 없이 UI plumbing만 검증 가능.

```bash
# UI 검증 단계 (모델 도착 전)
set TTT_ASR_BACKEND=dummy
streamlit run demo/app_kiosk.py

# 학습 모델 도착 후 — 코드 변경 0줄
set TTT_MODEL_PATH=C:\path\to\checkpoints\combined\best
streamlit run demo/app_kiosk.py
```

데모 단위 테스트 (모델/임베딩 의존성 없이 통과):

```bash
python -m pytest demo/tests -v
```

---

## AI Hub 데이터 확보 (전체 학습 시)

```bash
# 가이드 확인
python scripts/download_data.py --guide

# aihubshell 설치 후
pip install aihubshell
aihubshell -mode d -datasetkey 71 -o ./data/raw/dialect    # 방언 데이터
aihubshell -mode d -datasetkey 129 -o ./data/raw/elderly   # 노인 음성
```

> AI Hub 가입 및 학술 신청 → 1~3일 승인 → 무료 다운로드

### 데이터 전처리

```bash
python -m data.preprocess
```

---

## 학습 파이프라인

### Step 1 — 초기 파인튜닝 (AI Hub 전체 데이터)

```bash
python -m train.finetune \
    --config configs/config.yaml \
    --manifest ./data/processed/manifest.jsonl
```

학습 결과: `./checkpoints/finetune/best/`

### Step 2 — TTT 벤치마크 평가

```bash
python -m evaluation.evaluate \
    --base_model ./checkpoints/finetune/best \
    --manifest ./data/processed/manifest.jsonl \
    --output ./evaluation/results
```

결과물:
- `results.csv` — 화자별 WER 비교
- `wer_comparison.png` — 방언별 막대 그래프
- `dialect_age_heatmap.png` — 방언×연령대 히트맵

### Step 3 — 논문 실험 파이프라인 (B0/B1/P1/P2 + 통계검증 + 아블레이션)

```bash
python -m scripts.run_paper_pipeline \
    --manifest ./data/processed/manifest.jsonl \
    --finetuned_model ./checkpoints/finetune/best \
    --split_dir ./data/processed/splits \
    --result_dir ./evaluation/results
```

주요 산출물:
- `baseline_per_speaker.csv` / `baseline_summary.json`
- `ttt_variants_per_speaker.csv` / `ttt_variants_summary.json`
- `stat_tests.json` / `paper_main_table.csv`
- `ablation.csv` / `ablation_summary.csv`

제출 패키지 생성:

```bash
python -m scripts.package_paper --result_dir ./evaluation/results --out_dir ./paper_package
```

---

## TTT 동작 원리

```
[Whisper 파인튜닝 모델]
        ↓
  상위 2개 레이어만 언프리즈
        ↓
  사용자 캘리브레이션 (20문장, ~3분)
        ↓  AdamW, 30 steps, lr=1e-4
  개인화 모델 저장 (state_dict delta)
        ↓
  이후 모든 추론에 적용
        ↓
  수정 시 → 즉시 추가 학습 (지속 적응)
```

**왜 상위 레이어만?**
- 하위 레이어: 일반적인 음성 특징 (모든 사람 공통)
- 상위 레이어: 화자별 발화 패턴·언어 모델 (개인화 대상)
- 학습 파라미터 수를 전체의 ~8%로 제한 → 빠른 적응, 과적합 방지

---

## 예상 성능

| 모델 | 노인 WER | 방언 포함 WER |
|------|----------|--------------|
| 네이버 클로바 | 52% | 63% |
| Whisper Base | 61% | 72% |
| Whisper Fine-tuned | 38% | 45% |
| **Whisper + TTT (본 연구)** | **28%** | **32%** |

> 방언별로 제주도 화자에서 최대 개선 효과 기대 (WER 67% → 42%)

---

## 기술 스택

| 역할 | 도구 |
|------|------|
| 기반 STT | `openai-whisper` |
| TTT 구현 | `transformers` + 커스텀 학습 루프 |
| 음성 처리 | `librosa`, `torchaudio` |
| 평가 | `jiwer` (WER/CER) |
| 데모 앱 | `streamlit`, `plotly` |
| 데이터 | AI Hub (무료 학술 신청) |

---

## 차별화 포인트

1. **TTT를 한국 노인·방언에 적용한 사례 전무** — 학술적 신규성
2. **3분 캘리브레이션으로 개인화** — 특수 장비 불필요
3. **수정할수록 정확해짐** — 사용할수록 적응
4. **Apple·Meta가 주목하는 기술을 사회적 약자에 적용** — 스토리 차별화

---

## 라이선스

MIT License — 학술 및 비상업적 사용 허용
