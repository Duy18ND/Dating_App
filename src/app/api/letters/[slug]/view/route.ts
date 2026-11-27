import { getUser } from "@/lib/server/auth";
import { handle, json } from "@/lib/server/http";
import { getActiveLetter } from "@/lib/server/letters";
import { enforceRateLimit } from "@/lib/server/rate-limit";
import { registerView } from "@/lib/server/repo";

/** Gọi khi người nhận bóc dấu sáp. Chủ thiệp tự xem thử thì không tính lượt mở (FR-14). */
export async function POST(request: Request, ctx: RouteContext<"/api/letters/[slug]/view">) {
  return handle(async () => {
    const { slug } = await ctx.params;
    const letter = await getActiveLetter(slug);
    const viewer = await getUser().catch(() => null);
    if (viewer?.id === letter.owner_id) return json({ ok: true, counted: false });
    await enforceRateLimit(request, "view", slug);
    await registerView(slug);
    return json({ ok: true, counted: true });
  });
}
