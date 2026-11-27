import { customAlphabet, nanoid } from "nanoid";
import { ApiError, handle, json, parse, readJson } from "@/lib/server/http";
import { enforceRateLimit } from "@/lib/server/rate-limit";
import { deleteLetter, insertLetter, setLetterUploads } from "@/lib/server/repo";
import { verifyTurnstile } from "@/lib/server/turnstile";
import { collectUserImageUrls, letterPayloadSchema, LIMITS } from "@/lib/validation";

// Chữ thường và số để link dễ đọc, dễ gõ (VD: /l/k9x2m1).
const newSlug = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 6);

export async function POST(request: Request) {
  return handle(async () => {
    const payload = parse(letterPayloadSchema, await readJson(request, LIMITS.maxBodyBytes));
    await verifyTurnstile(request);
    const ipHash = await enforceRateLimit(request, "createLetter");

    let row = null;
    for (let attempt = 0; attempt < 5 && !row; attempt++) {
      row = await insertLetter({
        ...payload,
        slug: newSlug(),
        edit_token: nanoid(24),
        creator_ip_hash: ipHash,
      });
    }
    if (!row) throw new Error("Không sinh được slug mới");

    const claimed = await setLetterUploads(row.id, collectUserImageUrls(payload.canvas_data));
    if (!claimed) {
      await deleteLetter(row.id);
      throw new ApiError(400, "Có ảnh không hợp lệ, hãy tải ảnh lên lại");
    }
    return json({ slug: row.slug, edit_token: row.edit_token }, 201);
  });
}
