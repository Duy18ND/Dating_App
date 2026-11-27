import { handle, json } from "@/lib/server/http";
import { getActiveLetter } from "@/lib/server/letters";
import { enforceRateLimit } from "@/lib/server/rate-limit";
import { registerView } from "@/lib/server/repo";

/** Gọi khi người nhận bóc dấu sáp. */
export async function POST(request: Request, ctx: RouteContext<"/api/letters/[slug]/view">) {
  return handle(async () => {
    const { slug } = await ctx.params;
    await getActiveLetter(slug);
    await enforceRateLimit(request, "view", slug);
    await registerView(slug);
    return json({ ok: true });
  });
}
