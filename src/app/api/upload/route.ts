import { randomUUID } from "node:crypto";
import { requireUser } from "@/lib/server/auth";
import { ApiError, assertSameOrigin, handle, json } from "@/lib/server/http";
import { publicUrl, putWebp } from "@/lib/server/r2";
import { enforceAccountLimit, enforceRateLimit } from "@/lib/server/rate-limit";
import { deleteUpload, insertUpload } from "@/lib/server/repo";
import { verifyTurnstile } from "@/lib/server/turnstile";

const MAX_FILE_BYTES = 500 * 1024;
const MAX_REQUEST_BYTES = MAX_FILE_BYTES + 16 * 1024; // phần bao của multipart

function isWebp(bytes: Uint8Array): boolean {
  const ascii = (start: number, end: number) => String.fromCharCode(...bytes.subarray(start, end));
  return bytes.length > 12 && ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP";
}

export async function POST(request: Request) {
  return handle(async () => {
    assertSameOrigin(request);
    const user = await requireUser();
    if (Number(request.headers.get("content-length") ?? 0) > MAX_REQUEST_BYTES) {
      throw new ApiError(413, "Ảnh tối đa 500KB");
    }
    const form = await request.formData().catch(() => null);
    const file = form?.get("file");
    if (!(file instanceof File)) throw new ApiError(400, "Thiếu file ảnh");
    if (file.size > MAX_FILE_BYTES) throw new ApiError(413, "Ảnh tối đa 500KB");
    if (file.type !== "image/webp") throw new ApiError(415, "Chỉ nhận ảnh WebP");
    const bytes = new Uint8Array(await file.arrayBuffer());
    // MIME do client khai báo, nên kiểm tra thêm chữ ký file.
    if (!isWebp(bytes)) throw new ApiError(415, "File không phải ảnh WebP hợp lệ");

    await verifyTurnstile(request);
    const ipHash = await enforceRateLimit(request, "upload");
    await enforceAccountLimit("upload", user.id);

    const key = `uploads/${randomUUID()}.webp`;
    const url = publicUrl(key);
    // Ghi database trước: mọi file trên R2 đều có bản ghi để cron dọn được.
    // owner_id: chỉ chính người này gắn được ảnh vào thiệp của mình (0003).
    await insertUpload({ object_key: key, url, ip_hash: ipHash, owner_id: user.id });
    try {
      await putWebp(key, bytes);
    } catch (error) {
      await deleteUpload(key).catch(console.error);
      throw error;
    }
    return json({ url }, 201);
  });
}
