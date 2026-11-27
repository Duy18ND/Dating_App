import { ApiError, handle, json, parse, readJson, safeEqual } from "@/lib/server/http";
import { getActiveLetter, toPublicLetter } from "@/lib/server/letters";
import { enforceRateLimit } from "@/lib/server/rate-limit";
import { setLetterUploads, updateLetter } from "@/lib/server/repo";
import { collectUserImageUrls, letterPatchSchema, LIMITS } from "@/lib/validation";

// GET không tăng view_count: lượt mở được ghi qua POST ./view khi người nhận bóc dấu sáp.
export async function GET(_request: Request, ctx: RouteContext<"/api/letters/[slug]">) {
  return handle(async () => {
    const { slug } = await ctx.params;
    return json(toPublicLetter(await getActiveLetter(slug)));
  });
}

export async function PATCH(request: Request, ctx: RouteContext<"/api/letters/[slug]">) {
  return handle(async () => {
    const { slug } = await ctx.params;
    const token = request.headers.get("x-edit-token");
    if (!token) throw new ApiError(401, "Thiếu mã chỉnh sửa");
    await enforceRateLimit(request, "editLetter");
    const row = await getActiveLetter(slug);
    if (!safeEqual(token, row.edit_token)) throw new ApiError(403, "Mã chỉnh sửa không đúng");

    const patch = parse(letterPatchSchema, await readJson(request, LIMITS.maxBodyBytes));
    if (patch.canvas_data) {
      const claimed = await setLetterUploads(row.id, collectUserImageUrls(patch.canvas_data));
      if (!claimed) throw new ApiError(400, "Có ảnh không hợp lệ, hãy tải ảnh lên lại");
    }
    await updateLetter(row.id, patch);
    return json({ slug: row.slug });
  });
}
