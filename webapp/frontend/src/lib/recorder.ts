/**
 * 마이크 녹음 → WAV blob.
 *
 * MediaRecorder의 기본 포맷은 WebM/Opus라 백엔드의 soundfile이 못 디코드한다.
 * 그래서 Web Audio API로 PCM을 직접 받아 WAV(16-bit 16kHz mono)로 인코딩.
 * 이렇게 하면 백엔드는 ffmpeg 없이도 디코드 가능.
 */

const TARGET_SR = 16000;

interface RecorderHandle {
  stop: () => Promise<Blob>;
}

export async function startRecording(
  onLevel?: (rms: number) => void
): Promise<RecorderHandle> {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      channelCount: 1,
      noiseSuppression: true,
      echoCancellation: true,
    },
  });

  const ctx = new AudioContext();
  const source = ctx.createMediaStreamSource(stream);

  // ScriptProcessor는 deprecated이지만 polyfill 없이 가장 호환성 좋음
  const buffer = ctx.createScriptProcessor(4096, 1, 1);
  const chunks: Float32Array[] = [];
  buffer.onaudioprocess = (e) => {
    const data = e.inputBuffer.getChannelData(0);
    chunks.push(new Float32Array(data));

    if (onLevel) {
      // RMS 계산 → 0~1 정규화 (보통 발화 시 0.05~0.3)
      let sum = 0;
      for (let i = 0; i < data.length; i++) sum += data[i] * data[i];
      const rms = Math.sqrt(sum / data.length);
      onLevel(Math.min(1, rms * 4));
    }
  };
  source.connect(buffer);
  buffer.connect(ctx.destination);

  return {
    stop: async () => {
      buffer.disconnect();
      source.disconnect();
      stream.getTracks().forEach((t) => t.stop());
      const sourceRate = ctx.sampleRate;
      await ctx.close();

      const merged = mergeFloat32(chunks);
      const downsampled = downsample(merged, sourceRate, TARGET_SR);
      return encodeWav(downsampled, TARGET_SR);
    },
  };
}

function mergeFloat32(chunks: Float32Array[]): Float32Array {
  const length = chunks.reduce((s, c) => s + c.length, 0);
  const out = new Float32Array(length);
  let offset = 0;
  for (const c of chunks) {
    out.set(c, offset);
    offset += c.length;
  }
  return out;
}

function downsample(
  buffer: Float32Array,
  fromRate: number,
  toRate: number
): Float32Array {
  if (fromRate === toRate) return buffer;
  const ratio = fromRate / toRate;
  const newLength = Math.round(buffer.length / ratio);
  const result = new Float32Array(newLength);
  for (let i = 0; i < newLength; i++) {
    const start = Math.floor(i * ratio);
    const end = Math.min(buffer.length, Math.floor((i + 1) * ratio));
    let sum = 0;
    let count = 0;
    for (let j = start; j < end; j++) {
      sum += buffer[j];
      count++;
    }
    result[i] = count > 0 ? sum / count : 0;
  }
  return result;
}

function encodeWav(samples: Float32Array, sampleRate: number): Blob {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  // RIFF header
  writeString(view, 0, "RIFF");
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(view, 8, "WAVE");
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, "data");
  view.setUint32(40, samples.length * 2, true);

  // PCM 16-bit samples
  let offset = 44;
  for (let i = 0; i < samples.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return new Blob([buffer], { type: "audio/wav" });
}

function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}
