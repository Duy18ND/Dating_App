import "server-only";
import { ApiError, clientIp } from "./http";

export const TURNSTILE_HEADER = "x-turnstile-token";

export async function verifyTurnstile(request: Request): Promise<void> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    // Chỉ máy dev được bỏ qua. Production thiếu khóa thì từ chối.
    if (process.env.NODE_ENV === "development") return;
    throw new Error("Thiếu biến môi trường TURNSTILE_SECRET_KEY");
  }
  const token = request.headers.get(TURNSTILE_HEADER);
  if (!token) throw new ApiError(403, "Thiếu xác thực chống spam");

  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body: new URLSearchParams({ secret, response: token, remoteip: clientIp(request) }),
    signal: AbortSignal.timeout(8000),
  });
  const result = (await response.json()) as { success?: boolean };
  if (!result.success) throw new ApiError(403, "Xác thực chống spam thất bại, hãy thử lại");
}
