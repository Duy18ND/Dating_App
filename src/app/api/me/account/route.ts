import { z } from "zod";
import { requireUser } from "@/lib/server/auth";
import { assertSameOrigin, handle, json, parse, readJson } from "@/lib/server/http";
import { DELETE_ACCOUNT_CONFIRM } from "@/lib/my-letters";
import { deleteAuthUser } from "@/lib/server/repo";

// Phải gửi đúng chuỗi xác nhận: tránh xóa nhầm do một request lạc.
const confirmSchema = z.strictObject({ confirm: z.literal(DELETE_ACCOUNT_CONFIRM) });

/** Xóa tài khoản cùng toàn bộ thiệp và phản hồi. Ảnh thành vô chủ để cron dọn khỏi R2. */
export async function DELETE(request: Request) {
  return handle(async () => {
    assertSameOrigin(request);
    const user = await requireUser();
    parse(confirmSchema, await readJson(request, 1024));
    await deleteAuthUser(user.id);
    return json({ ok: true });
  });
}
