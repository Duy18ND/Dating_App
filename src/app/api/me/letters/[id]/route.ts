import { requireUser } from "@/lib/server/auth";
import { ApiError, assertSameOrigin, handle, json, parse, readJson } from "@/lib/server/http";
import { getOwnedLetter, toManagedLetter } from "@/lib/server/letters";
import { enforceAccountLimit } from "@/lib/server/rate-limit";
import { deleteOwnedLetter, setLetterUploads, updateOwnedLetter } from "@/lib/server/repo";
import { collectUserImageUrls, letterPatchSchema, LIMITS } from "@/lib/validation";

type Ctx = RouteContext<"/api/me/letters/[id]">;

/** Chi tiết thiệp để sửa, kèm phản hồi. Không phải chủ thì 404. */
export async function GET(_request: Request, ctx: Ctx) {
  return handle(async () => {
    const user = await requireUser();
    const { id } = await ctx.params;
    return json(await toManagedLetter(await getOwnedLetter(id, user.id)));
  });
}

/** Cập nhật nội dung, giữ nguyên slug để mã QR đã in vẫn dùng được. */
export async function PATCH(request: Request, ctx: Ctx) {
  return handle(async () => {
    assertSameOrigin(request);
    const user = await requireUser();
    const { id } = await ctx.params;
    const row = await getOwnedLetter(id, user.id);
    await enforceAccountLimit("editLetter", user.id);
    const patch = parse(letterPatchSchema, await readJson(request, LIMITS.maxBodyBytes));

    if (patch.canvas_data || patch.web_config) {
      // set_letter_uploads gỡ mọi ảnh KHÔNG có trong danh sách. Sửa một bên thì vẫn phải
      // gửi đủ ảnh của bên kia (lấy từ bản đang lưu), nếu không cron sẽ xóa mất chúng.
      const urls = collectUserImageUrls(
        patch.canvas_data ?? row.canvas_data,
        patch.web_config ?? row.web_config,
      );
      const claimed = await setLetterUploads(row.id, urls);
      if (!claimed) throw new ApiError(400, "Có ảnh không hợp lệ, hãy tải ảnh lên lại");
    }
    if (!(await updateOwnedLetter(row.id, user.id, patch))) {
      throw new ApiError(404, "Không tìm thấy thiệp");
    }
    return json({ id: row.id, slug: row.slug });
  });
}

/** Xóa thiệp và phản hồi; ảnh thành mồ côi để cron dọn. */
export async function DELETE(request: Request, ctx: Ctx) {
  return handle(async () => {
    assertSameOrigin(request);
    const user = await requireUser();
    const { id } = await ctx.params;
    const row = await getOwnedLetter(id, user.id);
    if (!(await deleteOwnedLetter(row.id, user.id))) throw new ApiError(404, "Không tìm thấy thiệp");
    return json({ ok: true });
  });
}
