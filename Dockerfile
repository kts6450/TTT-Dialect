# TTT-Dialect 데모용 이미지 (CPU only)
# 키오스크 + 챗봇 둘 다 같은 이미지로 빌드, 실행 시 streamlit 명령만 다르게.

FROM python:3.12-slim

WORKDIR /app

# soundfile/librosa 가 native 라이브러리 필요
RUN apt-get update && apt-get install -y --no-install-recommends \
    libsndfile1 \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# CPU-only torch 먼저 설치 (CUDA wheel은 ~2.5GB라 안 받음)
RUN pip install --no-cache-dir \
    --index-url https://download.pytorch.org/whl/cpu \
    torch==2.6.0 torchaudio==2.6.0

# 데모 의존성 (torch는 위에서 이미 설치됨 → pip가 skip)
COPY demo/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

# 앱 소스
COPY demo /app/demo

# Streamlit 설정 — 컨테이너 외부 접근 허용
ENV STREAMLIT_SERVER_HEADLESS=true \
    STREAMLIT_SERVER_ADDRESS=0.0.0.0 \
    STREAMLIT_BROWSER_GATHER_USAGE_STATS=false \
    PYTHONUNBUFFERED=1

EXPOSE 8501

# docker-compose에서 service별로 override
CMD ["streamlit", "run", "demo/app_kiosk.py", "--server.port=8501"]
