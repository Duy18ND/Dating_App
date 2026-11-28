import { getCommunityOverview } from "@/lib/server/community";
import { handle, json } from "@/lib/server/http";

export async function GET() {
  return handle(async () => json(await getCommunityOverview()));
}
