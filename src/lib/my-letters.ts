/** Chuỗi người dùng phải gõ để xóa tài khoản. API kiểm tra đúng chuỗi này. */
export const DELETE_ACCOUNT_CONFIRM = "XOA TAI KHOAN";

/** Cảnh báo khi thiệp còn từ ngần này ngày trở xuống (FR-14). */
export const EXPIRY_WARNING_DAYS = 7;

const DAY_MS = 86_400_000;

/** Số ngày còn lại trước khi thiệp bị xóa, làm tròn lên; 0 khi đã quá hạn. */
export function daysLeft(expiresAt: string, now = Date.now()): number {
  const left = Date.parse(expiresAt) - now;
  return left <= 0 ? 0 : Math.ceil(left / DAY_MS);
}

export function expiryState(expiresAt: string, now = Date.now()) {
  const days = daysLeft(expiresAt, now);
  return {
    days,
    expired: days === 0,
    warning: days > 0 && days <= EXPIRY_WARNING_DAYS,
  };
}

/**
 * Tên hiện trong danh sách: tiêu đề người dùng đặt, nếu trống thì "Thiệp N" theo thứ tự tạo
 * (thiệp tạo đầu tiên là Thiệp 1). `letters` sắp mới nhất trước như API trả về.
 */
export function letterNames<T extends { id: string; title: string; created_at: string }>(
  letters: T[],
): Map<string, string> {
  const oldestFirst = [...letters].sort((a, b) => a.created_at.localeCompare(b.created_at));
  return new Map(
    oldestFirst.map((letter, index) => [letter.id, letter.title.trim() || `Thiệp ${index + 1}`]),
  );
}

export const formatDate = (iso: string) =>
  new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }).format(
    new Date(iso),
  );
