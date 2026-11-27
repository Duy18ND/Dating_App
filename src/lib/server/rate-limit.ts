import "server-only";
import { ApiError, clientIp, hashIp } from "./http";
import { consumeRateLimit } from "./repo";

const HOUR = 60 * 60;

export const RATE_LIMITS = {
  // 4 ảnh thiệp + 8 ảnh trang web, cộng chỗ cho vài lần đổi ảnh (v1.2).
  upload: { max: 20, windowSeconds: HOUR, message: "Tối đa 20 ảnh mỗi giờ" },
  createLetter: { max: 5, windowSeconds: 24 * HOUR, message: "Tối đa 5 lá thư mỗi ngày" },
  editLetter: { max: 60, windowSeconds: HOUR, message: "Bạn sửa quá nhanh, thử lại sau" },
  respond: { max: 20, windowSeconds: HOUR, message: "Bạn gửi quá nhiều phản hồi, thử lại sau" },
  view: { max: 10, windowSeconds: HOUR, message: "Đã ghi nhận lượt mở" },
} as const;

/** Trả về IP đã hash. Ném 429 nếu vượt giới hạn. `scope` tách giới hạn theo từng thư. */
export async function enforceRateLimit(
  request: Request,
  action: keyof typeof RATE_LIMITS,
  scope = "",
): Promise<string> {
  const ipHash = hashIp(clientIp(request));
  const { max, windowSeconds, message } = RATE_LIMITS[action];
  const allowed = await consumeRateLimit(`${action}:${scope}:${ipHash}`, max, windowSeconds);
  if (!allowed) throw new ApiError(429, message);
  return ipHash;
}

/** Giới hạn theo tài khoản, chặn một người đổi mạng liên tục để lách giới hạn theo IP. */
export async function enforceAccountLimit(
  action: keyof typeof RATE_LIMITS,
  userId: string,
): Promise<void> {
  const { max, windowSeconds, message } = RATE_LIMITS[action];
  const allowed = await consumeRateLimit(`${action}:user:${userId}`, max, windowSeconds);
  if (!allowed) throw new ApiError(429, message);
}
