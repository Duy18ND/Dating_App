import { createSiteReview } from "@/lib/server/community";
import { assertSameOrigin, handle, json, parse, readJson } from "@/lib/server/http";
import { enforceRateLimit } from "@/lib/server/rate-limit";
import { siteReviewSchema } from "@/lib/validation";

export async function POST(request: Request) {
  return handle(async () => {
    assertSameOrigin(request);
    const input = parse(siteReviewSchema, await readJson(request, 8 * 1024));
    const ipHash = await enforceRateLimit(request, "review");
    const review = await createSiteReview({ ...input, ip_hash: ipHash });
    return json(review, 201);
  });
}
