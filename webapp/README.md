# Hades — 어르신 음성 체험 예약

학습된 방언/노인 Whisper + Claude API + React 프론트엔드.
**음성 + 클릭 병행 Zero UI** 챗봇.

## 폴더

```
webapp/
├── backend/              # FastAPI (Python)
│   ├── main.py           # 진입점, .env 자동 로드
│   ├── routers/
│   │   ├── voice.py      # POST /api/voice/turn (multipart audio)
│   │   ├── catalog.py    # 체험 카탈로그
│   │   └── reservation.py
│   ├── services/
│   │   ├── asr.py        # demo/asr.py 재사용 (CUDA→MPS→CPU)
│   │   ├── llm.py        # Claude API + 시스템 프롬프트(카탈로그 캐싱)
│   │   ├── tts.py        # gTTS mp3
│   │   ├── catalog.py
│   │   └── reservation_store.py
│   └── data/catalog.json # 시골+도시 mix 10개 체험
├── frontend/             # Vite + React + TS
│   └── src/
│       ├── App.tsx
│       ├── components/
│       │   ├── MicButton.tsx        # 거대 마이크 + idle 글로우/녹음 음량 막대/답변 음파
│       │   ├── Stepper.tsx          # 6단계 진행 막대
│       │   ├── HelpHints.tsx        # 진행 상황별 예시 발화 힌트
│       │   ├── ConversationView.tsx # 대화 카드
│       │   ├── SlotPanel.tsx        # 채워진 슬롯 시각화
│       │   ├── SlotForm.tsx         # 단계별 클릭 입력 폼 (음성 폴백)
│       │   ├── CatalogPanel.tsx     # 사이드 카탈로그 (선택 시 황금 강조)
│       │   ├── ExperienceModal.tsx  # 카드 클릭 → 상세 + "이걸로 예약"
│       │   ├── ConfirmCard.tsx      # 슬롯 다 채워지면 큰 확인 카드
│       │   ├── ReceiptCard.tsx      # 예약 완료 영수증
│       │   ├── FontSizeToggle.tsx   # 보통/크게/특대
│       │   └── Header.tsx
│       ├── hooks/
│       │   └── useVoiceSession.ts   # 마이크 ↔ 백엔드 ↔ TTS 파이프라인
│       ├── lib/
│       │   ├── api.ts
│       │   └── recorder.ts          # WAV 16kHz mono 인코딩 + RMS 콜백
│       └── store/
│           └── conversation.ts      # Zustand
└── README.md (이 파일)
```

## 개발 실행

### 1. 환경변수 (.env, 프로젝트 루트)

```bash
TTT_ASR_BACKEND=          # 빈 값 = Whisper / "dummy" = 더미 백엔드
TTT_MODEL_PATH=           # 학습된 체크포인트 경로 (없으면 whisper-small 폴백)
ANTHROPIC_API_KEY=sk-ant-...
```

`.env`는 git 무시. backend가 시작 시 자동으로 읽음 (python-dotenv).

### 2. 백엔드 (port 8088)

```bash
cd webapp/backend
pip install -r requirements.txt
uvicorn main:app --port 8088 --reload
```

### 3. 프론트엔드 (port 5173)

```bash
cd webapp/frontend
npm install
npm run dev
```

브라우저에서 http://localhost:5173. Vite가 `/api` 호출을 자동으로 백엔드(8088)로 프록시.

## 학습 모델 swap

학습된 체크포인트 도착 후:

```bash
# .env 수정
TTT_MODEL_PATH=C:\path\to\checkpoints\combined\best
TTT_ASR_BACKEND=
```

backend 재시작 → `demo/asr.py`의 `_resolve_model_path()`가 검증 후 자동 로드.

## 시연 흐름

음성/클릭 둘 다 가능. 둘 중 빠른 쪽으로:

1. **체험 선택** — 사이드 카드 클릭 → 모달 → "이걸로 예약 시작" / 또는 마이크에 "도자기 빚는 거 해보고 싶어요"
2. **날짜** — "다음 주 토요일" 빠른 버튼 / 또는 "다음 주 토요일에"
3. **시간** — "오후 2시" 버튼 / 또는 "오후 두 시"
4. **인원** — +/- 버튼 / 또는 "두 명이서"
5. **이름** — 텍스트 입력 / 또는 "김영자라고 합니다"
6. **연락처** — 텍스트 입력 / 또는 "공일공 일이삼사 오륙칠팔"
7. **확인 카드** 자동 노출 → 큰 "예약 확정" 버튼 / 또는 "네 맞아요"
8. **영수증 카드** — 예약번호 + 결제 금액 표시

## 현재 구현

- [x] 음성 한 turn (마이크 → ASR → LLM → TTS → 자동 재생)
- [x] 6단계 진행 막대
- [x] 진행 상황별 예시 발화 힌트
- [x] 환영 메시지 자동 + 첫 클릭 시 환영 음성 unlock
- [x] 마이크 idle 글로우 / 녹음 음량 9개 막대 / 답변 7개 음파
- [x] 카탈로그 카드 클릭 모달 + 음성 선택 시 자동 강조·스크롤
- [x] 슬롯 빠른 입력 폼 (체험/날짜/시간/인원/이름/연락처)
- [x] 모든 슬롯 채워지면 확인 카드 → 예약 자동 생성 → 영수증
- [x] 글씨 크기 토글 (보통/크게/특대, rem 단위 전체 스케일)
- [x] TTS 끄기/켜기, 처음부터 리셋
- [x] Claude 시스템 프롬프트에 카탈로그 ephemeral 캐싱
- [x] Slot/Intent 추출 (Claude structured output)

## 다음 단계 후보

- [ ] VAD (자동 발화 감지) — 마이크 안 눌러도 끝 자동 감지
- [ ] AI 답변 인터럽트 — TTS 중 사용자 발화 시 즉시 멈춤
- [ ] 베이스 vs 학습 모델 A/B 토글 — 시연 핵심 자산
- [ ] 모바일 반응형 보강
- [ ] 다국어 (영어 폴백)
- [ ] 실제 결제 시뮬레이션 단계
