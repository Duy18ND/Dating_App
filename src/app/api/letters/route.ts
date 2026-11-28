import { customAlphabet } from "nanoid";
import { requireUser } from "@/lib/server/auth";
import { ApiError, assertSameOrigin, handle, json, parse, readJson } from "@/lib/server/http";
import { enforceAccountLimit, enforceRateLimit } from "@/lib/server/rate-limit";
import { deleteLetter, insertLetter, setLetterUploads } from "@/lib/server/repo";
import { verifyTurnstile } from "@/lib/server/turnstile";
import { collectUserImageUrls, letterPayloadSchema, LIMITS } from "@/lib/validation";

// Chuỗi bí mật ngẫu nhiên 12 ký tự không trùng nhau (khớp VARCHAR(12) UNIQUE trong DB).
const newSlug = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 12);

export async function POST(request: Request) {
  return handle(async () => {
    assertSameOrigin(request);
    const user = await requireUser();
    const payload = parse(letterPayloadSchema, await readJson(request, LIMITS.maxBodyBytes));
    await verifyTurnstile(request);
    const ipHash = await enforceRateLimit(request, "createLetter");
    await enforceAccountLimit("createLetter", user.id);

    let row = null;
    for (let attempt = 0; attempt < 5 && !row; attempt++) {
      row = await insertLetter({
        ...payload,
        slug: newSlug(),
        owner_id: user.id,
        creator_ip_hash: ipHash,
      });
    }
    if (!row) throw new Error("Không sinh được slug mới");

    // Gắn cả ảnh thiệp lẫn ảnh trang web: ảnh nào không gắn sẽ bị cron coi là mồ côi và xóa.
    const claimed = await setLetterUploads(
      row.id,
      collectUserImageUrls(payload.canvas_data, payload.web_config),
    );
    if (!claimed) {
      await deleteLetter(row.id);
      throw new ApiError(400, "Có ảnh không hợp lệ, hãy tải ảnh lên lại");
    }
    return json({ id: row.id, slug: row.slug }, 201);
  });
}
