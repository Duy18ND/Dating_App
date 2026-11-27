import { runCleanup } from "@/lib/server/cleanup";
import { requireEnv } from "@/lib/server/env";
import { ApiError, handle, json, safeEqual } from "@/lib/server/http";

export const maxDuration = 60;

/** Vercel Cron gọi hằng ngày (vercel.json) kèm header `Authorization: Bearer $CRON_SECRET`. */
export async function GET(request: Request) {
  return handle(async () => {
    const given = request.headers.get("authorization") ?? "";
    // Thiếu CRON_SECRET thì requireEnv ném lỗi: không bao giờ chạy khi chưa cấu hình.
    if (!safeEqual(given, `Bearer ${requireEnv("CRON_SECRET")}`)) {
      throw new ApiError(401, "Không có quyền");
    }
    return json(await runCleanup());
  });
}
