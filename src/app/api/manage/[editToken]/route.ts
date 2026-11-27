import { handle, json } from "@/lib/server/http";
import { getManagedLetter } from "@/lib/server/letters";

export async function GET(_request: Request, ctx: RouteContext<"/api/manage/[editToken]">) {
  return handle(async () => {
    const { editToken } = await ctx.params;
    return json(await getManagedLetter(editToken));
  });
}
