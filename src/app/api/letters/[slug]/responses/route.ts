import { ApiError, handle, json, parse, readJson } from "@/lib/server/http";
import { getActiveLetter } from "@/lib/server/letters";
import { enforceRateLimit } from "@/lib/server/rate-limit";
import { insertResponse } from "@/lib/server/repo";
import { responseSchema, type ResponseInput } from "@/lib/validation";
import type { WebConfig } from "@/types/letter";

function assertBlockAccepts(input: ResponseInput, blocks: WebConfig["blocks"]) {
  const block = {
    accept: blocks.acceptButton,
    rsvp: blocks.rsvp,
    poll: blocks.poll,
  }[input.action_type];
  if (!block?.enabled) throw new ApiError(400, "Lá thư này không nhận loại phản hồi đó");
  if (input.action_type === "poll" && !blocks.poll?.options.includes(input.poll_option)) {
    throw new ApiError(400, "Phương án bình chọn không tồn tại");
  }
}

export async function POST(request: Request, ctx: RouteContext<"/api/letters/[slug]/responses">) {
  return handle(async () => {
    const { slug } = await ctx.params;
    const input = parse(responseSchema, await readJson(request, 8 * 1024));
    const letter = await getActiveLetter(slug);
    assertBlockAccepts(input, letter.web_config.blocks);
    await enforceRateLimit(request, "respond", slug);

    await insertResponse({
      letter_id: letter.id,
      action_type: input.action_type,
      responder_name: input.responder_name || null,
      message: input.message || null,
      status: input.action_type === "poll" ? null : input.status,
      guest_count:
        input.action_type !== "rsvp" ? null : input.status === "attending" ? input.guest_count : 0,
      poll_option: input.action_type === "poll" ? input.poll_option : null,
    });
    return json({ ok: true }, 201);
  });
}
