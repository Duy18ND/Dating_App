import { requireUser } from "@/lib/server/auth";
import { handle, json } from "@/lib/server/http";
import { listOwnedLetters } from "@/lib/server/repo";

/** Thiệp của tài khoản đang đăng nhập, mới nhất trước. */
export async function GET() {
  return handle(async () => {
    const user = await requireUser();
    return json(await listOwnedLetters(user.id));
  });
}
