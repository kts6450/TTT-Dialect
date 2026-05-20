#!/usr/bin/env bash
# 저장소 루트에 .env 생성 (.env.example 복사)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="$ROOT/.env"
EXAMPLE="$ROOT/.env.example"

if [[ ! -f "$EXAMPLE" ]]; then
  echo "오류: .env.example 이 없습니다: $EXAMPLE" >&2
  exit 1
fi

if [[ -f "$ENV_FILE" ]]; then
  echo "이미 있습니다: $ENV_FILE"
  echo "덮어쓰려면: rm .env && ./scripts/setup-env.sh"
  exit 0
fi

cp "$EXAMPLE" "$ENV_FILE"
echo "생성됨: $ENV_FILE"
echo ""
echo "다음 단계:"
echo "  1. 편집기로 .env 를 열고 ANTHROPIC_API_KEY, OPENAI_API_KEY 를 붙여넣기"
echo "  2. 백엔드 재시작 (uvicorn 이 이미 떠 있으면 한 번 끄고 다시 실행)"
echo ""
echo "  cd webapp/backend && uvicorn main:app --host 0.0.0.0 --port 8088 --reload"
