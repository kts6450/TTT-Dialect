# 추론용 Whisper 체크포인트 (호스트)

학습이 끝난 Hugging Face 스타일 디렉터리를 **이 폴더 아래 아무 이름으로** 두고, `TTT_MODEL_DIR`에서 그 하위 경로를 가리키면 됩니다.

예:

```text
models/inference/
  my-run-001/
    config.json
    preprocessor_config.json
    model.safetensors
    ...
```

자세한 절차는 저장소 루트의 [MODEL_SETUP.md](../MODEL_SETUP.md)를 보세요.
