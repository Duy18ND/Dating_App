const STORAGE_KEY = "thunho:seen-responses";

/** Đọc số phản hồi đã xem của từng thiệp (lưu cục bộ trên trình duyệt chủ tài khoản). */
export function getSeenResponses(): Record<string, number> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return {};
    const out: Record<string, number> = {};
    for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof v === "number" && Number.isFinite(v) && v >= 0) out[k] = v;
    }
    return out;
  } catch {
    return {};
  }
}

/** Ghi nhận chủ tài khoản đã xem đủ `count` phản hồi của thiệp `letterId`. */
export function markResponsesSeen(letterId: string, count: number): void {
  if (typeof window === "undefined") return;
  try {
    const next = getSeenResponses();
    next[letterId] = Math.max(0, Math.floor(count));
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Bỏ qua khi trình duyệt chặn localStorage (ẩn danh).
  }
}

/** Số phản hồi mới chưa xem của một thiệp. */
export function unreadResponseCount(
  letterId: string,
  total: number,
  seenMap: Record<string, number>,
): number {
  const seen = seenMap[letterId] ?? 0;
  return Math.max(0, total - seen);
}
