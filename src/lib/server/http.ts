import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { unstable_rethrow } from "next/navigation";
import { z } from "zod";
import { requireEnv } from "./env";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export function json(body: unknown, status = 200): Response {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

/** Chạy handler và đổi lỗi thành JSON. Lỗi ngoài dự kiến chỉ ghi log, không trả chi tiết. */
export async function handle(run: () => Promise<Response>): Promise<Response> {
  try {
    return await run();
  } catch (error) {
    unstable_rethrow(error);
    if (error instanceof ApiError) return json({ error: error.message }, error.status);
    console.error(error);
    return json({ error: "Có lỗi phía máy chủ, vui lòng thử lại." }, 500);
  }
}

/**
 * Chống CSRF cho API thay đổi dữ liệu: cookie phiên tự đi kèm mọi request nên phải chắc
 * request xuất phát từ chính trang này. Trình duyệt luôn gửi Origin với POST/PATCH/DELETE.
 */
export function assertSameOrigin(request: Request): void {
  const origin = request.headers.get("origin");
  const allowed = new Set([new URL(request.url).origin]);
  const site = process.env.NEXT_PUBLIC_SITE_URL;
  if (site) allowed.add(new URL(site).origin);
  if (!origin || !allowed.has(origin)) throw new ApiError(403, "Yêu cầu không hợp lệ");
}

export function parse<T>(schema: z.ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value);
  if (!result.success) {
    const issue = result.error.issues[0];
    throw new ApiError(400, `${issue.path.join(".") || "dữ liệu"}: ${issue.message}`);
  }
  return result.data;
}

export async function readJson(request: Request, maxBytes: number): Promise<unknown> {
  if (Number(request.headers.get("content-length") ?? 0) > maxBytes) {
    throw new ApiError(413, "Dữ liệu quá lớn");
  }
  const text = await request.text();
  if (Buffer.byteLength(text) > maxBytes) throw new ApiError(413, "Dữ liệu quá lớn");
  try {
    return JSON.parse(text);
  } catch {
    throw new ApiError(400, "JSON không hợp lệ");
  }
}

/** Trên Cloudflare/Vercel các header này do nền tảng ghi đè. Nơi khác cần proxy tin cậy đặt chúng. */
export function clientIp(request: Request): string {
  return (
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-real-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    "unknown"
  );
}

export function hashIp(ip: string): string {
  return createHmac("sha256", requireEnv("IP_HASH_SALT")).update(ip).digest("hex");
}

export function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}
