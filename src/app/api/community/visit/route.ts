import { recordSiteVisit } from "@/lib/server/community";
import { assertSameOrigin, handle, json } from "@/lib/server/http";

export async function POST(request: Request) {
  return handle(async () => {
    assertSameOrigin(request);
    const visits = await recordSiteVisit();
    return json({ ok: true, visits });
  });
}
