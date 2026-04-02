# 데이터셋 고정 프로토콜 (논문 재현용)

## 목적
- 화자 누수(train/test 화자 중복) 방지
- 지역/발화유형 대표성 유지
- 실험 재현성을 위한 고정 분할 제공

## 원칙
- 화자 독립 분할: `speaker_id` 기준으로 train/val/test를 분리
- 층화 기준: `dialect`, `utterance_type`
- 기본 비율: train 0.8 / val 0.1 / test 0.1
- 고정 시드: 42

## 생성 명령어
```bash
python -m data.split_protocol \
  --manifest ./data/processed/manifest.jsonl \
  --output_dir ./data/processed/splits \
  --seed 42
```

## 생성 산출물
- `train.jsonl`
- `val.jsonl`
- `test.jsonl`
- `manifest_with_split.jsonl`
- `split_report.json`

## 학습 시 사용 규칙
- 베이스라인(B0/B1), 제안모델(P1/P2), 아블레이션 전부 동일 `test.jsonl`만 사용
- 테스트셋을 모델 선택/하이퍼파라미터 탐색에 사용하지 않음
- 하이퍼파라미터 결정은 train/val에서만 수행
