/** Giới hạn server nhận khi upload lên R2/Storage. */
export const MAX_UPLOAD_AUDIO_BYTES = 5 * 1024 * 1024; // 5 MB
/** Giới hạn file gốc người dùng có thể chọn từ máy để cắt ngay trên trình duyệt. */
export const MAX_LOCAL_AUDIO_BYTES = 30 * 1024 * 1024; // 30 MB
/** Tần số mẫu mono 16-bit khi xuất đoạn đã cắt: 44.1 KB/giây -> tối đa 110 giây (~4.85 MB < 5 MB). */
export const TRIM_SAMPLE_RATE = 22050;
export const MAX_TRIM_SECONDS = 110;
export const MIN_TRIM_SECONDS = 5;

/** Ước tính chính xác dung lượng file WAV sau khi cắt theo độ dài (giây). */
export function estimateTrimBytes(durationSec: number): number {
  const clamped = Math.max(0, Math.min(MAX_TRIM_SECONDS, durationSec));
  return Math.round(clamped * TRIM_SAMPLE_RATE) * 2 + 44;
}

/** Đổi đuôi file sang .wav gọn đẹp sau khi cắt. */
export function trimmedFileName(originalName: string): string {
  const base = originalName.replace(/\.[^.]+$/, "").trim() || "nhac-nen";
  return `${base.slice(0, 80)}-cat.wav`;
}

/** Giải mã file nhạc (MP3, M4A, OGG, WAV, WebM...) trực tiếp trên trình duyệt bằng Web Audio API. */
export async function decodeAudioFile(file: File): Promise<AudioBuffer> {
  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) {
    throw new Error("Trình duyệt không hỗ trợ cắt nhạc trực tiếp.");
  }
  const arrayBuffer = await file.arrayBuffer();
  const ctx = new AudioCtx();
  try {
    return await ctx.decodeAudioData(arrayBuffer);
  } catch {
    throw new Error("Không đọc được file nhạc này. Hãy thử file MP3, M4A hoặc WAV chuẩn.");
  } finally {
    void ctx.close().catch(() => {});
  }
}

/**
 * Cắt đoạn [startSec, startSec + durationSec] từ AudioBuffer, trộn về mono 22.05kHz 16-bit WAV
 * kèm fade-in 0.35s & fade-out 0.7s để phát mượt và luôn nhỏ hơn 5MB.
 */
export function trimAudioBufferToWav(
  buffer: AudioBuffer,
  startSec: number,
  durationSec: number,
): Blob {
  const safeStart = Math.max(0, Math.min(buffer.duration - 1, startSec));
  const safeDur = Math.max(
    1,
    Math.min(MAX_TRIM_SECONDS, durationSec, Math.max(1, buffer.duration - safeStart)),
  );

  const srcRate = buffer.sampleRate;
  const srcStart = Math.floor(safeStart * srcRate);
  const srcLength = Math.max(1, Math.min(buffer.length - srcStart, Math.floor(safeDur * srcRate)));
  const outLength = Math.max(1, Math.floor(safeDur * TRIM_SAMPLE_RATE));

  const channels: Float32Array[] = [];
  for (let c = 0; c < buffer.numberOfChannels; c++) {
    channels.push(buffer.getChannelData(c));
  }
  const chCount = channels.length;

  const wavBytes = new ArrayBuffer(44 + outLength * 2);
  const view = new DataView(wavBytes);
  const writeAscii = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };

  writeAscii(0, "RIFF");
  view.setUint32(4, 36 + outLength * 2, true);
  writeAscii(8, "WAVE");
  writeAscii(12, "fmt ");
  view.setUint32(16, 16, true); // PCM header size
  view.setUint16(20, 1, true); // PCM format
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, TRIM_SAMPLE_RATE, true);
  view.setUint32(28, TRIM_SAMPLE_RATE * 2, true); // byte rate
  view.setUint16(32, 2, true); // block align
  view.setUint16(34, 16, true); // 16-bit
  writeAscii(36, "data");
  view.setUint32(40, outLength * 2, true);

  const ratio = srcRate / TRIM_SAMPLE_RATE;
  const fadeInSamples = Math.min(Math.floor(0.35 * TRIM_SAMPLE_RATE), Math.floor(outLength / 4));
  const fadeOutSamples = Math.min(Math.floor(0.7 * TRIM_SAMPLE_RATE), Math.floor(outLength / 3));

  for (let i = 0; i < outLength; i++) {
    const pos = i * ratio;
    const i0 = Math.min(srcLength - 1, Math.floor(pos));
    const i1 = Math.min(srcLength - 1, i0 + 1);
    const frac = pos - i0;

    let sample = 0;
    for (let c = 0; c < chCount; c++) {
      const ch = channels[c];
      sample += ch[srcStart + i0] * (1 - frac) + ch[srcStart + i1] * frac;
    }
    sample /= chCount;

    if (i < fadeInSamples) {
      sample *= i / fadeInSamples;
    } else if (i > outLength - fadeOutSamples) {
      sample *= (outLength - i) / fadeOutSamples;
    }

    const clamped = Math.max(-1, Math.min(1, sample));
    view.setInt16(44 + i * 2, Math.round(clamped * 32767), true);
  }

  return new Blob([wavBytes], { type: "audio/wav" });
}
