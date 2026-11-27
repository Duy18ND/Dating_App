import { handle, json } from "@/lib/server/http";
import { getActiveLetter, toPublicLetter } from "@/lib/server/letters";

// GET không tăng view_count: lượt mở được ghi qua POST ./view khi người nhận bóc dấu sáp.
// Sửa thư nằm ở /api/me/letters/[id] (bắt buộc đăng nhập đúng chủ).
export async function GET(_request: Request, ctx: RouteContext<"/api/letters/[slug]">) {
  return handle(async () => {
    const { slug } = await ctx.params;
    return json(toPublicLetter(await getActiveLetter(slug)));
  });
}
