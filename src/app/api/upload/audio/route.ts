import { randomUUID } from "node:crypto";
import { requireUser } from "@/lib/server/auth";
import { ApiError, assertSameOrigin, handle, json } from "@/lib/server/http";
import { publicUrl, putObject } from "@/lib/server/r2";
import { enforceAccountLimit, enforceRateLimit } from "@/lib/server/rate-limit";
import { deleteUpload, insertUpload } from "@/lib/server/repo";
import { verifyTurnstile } from "@/lib/server/turnstile";

const MAX_AUDIO_BYTES = 5 * 1024 * 1024; // 5 MB
const MAX_REQUEST_BYTES = MAX_AUDIO_BYTES + 32 * 1024;

interface DetectedAudio {
  ext: string;
  mime: string;
}

/** Kiểm tra chữ ký byte thật của file nhạc (MP3 / M4A / OGG / WAV / WebM). */
function detectAudioFormat(bytes: Uint8Array): DetectedAudio | null {
  if (bytes.length < 12) return null;
  const ascii = (start: number, end: number) => String.fromCharCode(...bytes.subarray(start, end));

  // MP3: ID3 tag hoặc MPEG frame sync (0xFF 0xE0..0xFF)
  if (ascii(0, 3) === "ID3" || (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0)) {
    return { ext: "mp3", mime: "audio/mpeg" };
  }
  // M4A / MP4 audio: ISO BMFF "ftyp" ở byte 4..8
  if (ascii(4, 8) === "ftyp") {
    return { ext: "m4a", mime: "audio/mp4" };
  }
  // OGG
  if (ascii(0, 4) === "OggS") {
    return { ext: "ogg", mime: "audio/ogg" };
  }
  // WAV: RIFF....WAVE
  if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WAVE") {
    return { ext: "wav", mime: "audio/wav" };
  }
  // WebM / Matroska EBML
  if (bytes[0] === 0x1a && bytes[1] === 0x45 && bytes[2] === 0xdf && bytes[3] === 0xa3) {
    return { ext: "webm", mime: "audio/webm" };
  }
  return null;
}

export async function POST(request: Request) {
  return handle(async () => {
    assertSameOrigin(request);
    const user = await requireUser();
    if (Number(request.headers.get("content-length") ?? 0) > MAX_REQUEST_BYTES) {
      throw new ApiError(413, "File nhạc tối đa 5MB");
    }
    const form = await request.formData().catch(() => null);
    const file = form?.get("file");
    if (!(file instanceof File)) throw new ApiError(400, "Thiếu file nhạc");
    if (file.size === 0) throw new ApiError(400, "File nhạc rỗng");
    if (file.size > MAX_AUDIO_BYTES) throw new ApiError(413, "File nhạc tối đa 5MB");

    const bytes = new Uint8Array(await file.arrayBuffer());
    const format = detectAudioFormat(bytes);
    if (!format) {
      throw new ApiError(415, "Chỉ hỗ trợ file nhạc MP3, M4A, OGG, WAV hoặc WebM hợp lệ");
    }

    await verifyTurnstile(request);
    const ipHash = await enforceRateLimit(request, "upload");
    await enforceAccountLimit("upload", user.id);

    const key = `uploads/audio/${randomUUID()}.${format.ext}`;
    const url = publicUrl(key);
    await insertUpload({ object_key: key, url, ip_hash: ipHash, owner_id: user.id });
    try {
      await putObject(key, bytes, format.mime);
    } catch (error) {
      await deleteUpload(key).catch(console.error);
      throw error;
    }
    return json({ url, name: file.name.slice(0, 120) }, 201);
  });
}
