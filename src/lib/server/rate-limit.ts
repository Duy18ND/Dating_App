import "server-only";
import { ApiError, clientIp, hashIp } from "./http";
import { consumeRateLimit } from "./repo";

const HOUR = 60 * 60;

export const RATE_LIMITS = {
  upload: { max: 10, windowSeconds: HOUR, message: "Tối đa 10 ảnh mỗi giờ" },
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
