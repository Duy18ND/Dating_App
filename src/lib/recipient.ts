import { LIMITS } from "@/lib/validation";

/**
 * Tên người nhận lấy từ ?to=Minh-Anh (FR-08). Dữ liệu này do bất kỳ ai gõ vào URL,
 * nên chỉ giữ chữ, số, khoảng trắng và vài dấu câu thường gặp trong tên.
 * Trả về chuỗi rỗng nếu không còn gì hợp lệ.
 */
export function sanitizeRecipient(raw: string | string[] | undefined | null): string {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value) return "";
  const cleaned = value
    .slice(0, 500)
    .normalize("NFC")
    .replace(/-/g, " ")
    .replace(/[^\p{L}\p{M}\p{N} .,'&()!]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
  return [...cleaned].slice(0, LIMITS.maxNameLength).join("").trim();
}

/** Link riêng cho từng khách. Khoảng trắng đổi thành gạch ngang cho dễ đọc. */
export function recipientLink(url: string, name: string): string {
  const clean = sanitizeRecipient(name);
  return clean ? `${url}?to=${encodeURIComponent(clean.replace(/ /g, "-"))}` : url;
}
