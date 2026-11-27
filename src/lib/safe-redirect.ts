/** Trang mặc định sau khi đăng nhập. */
export const AFTER_LOGIN = "/thiep-cua-toi";

/**
 * Chỉ nhận đường dẫn nội bộ bắt đầu bằng một dấu "/" (FR-14). Chặn "//evil.com",
 * "/\\evil.com", "https://...", "javascript:" và ký tự điều khiển, để tham số ?next=
 * không thành chỗ chuyển hướng ra ngoài.
 */
export function safeNext(raw: string | null | undefined, fallback = AFTER_LOGIN): string {
  if (!raw || raw.length > 512) return fallback;
  if (!raw.startsWith("/") || /^\/[/\\]/.test(raw) || /[\u0000-\u001f\\]/.test(raw)) {
    return fallback;
  }
  try {
    const base = "https://noi-bo.invalid";
    const url = new URL(raw, base);
    if (url.origin !== base) return fallback;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}

/** Đường dẫn trang đăng nhập kèm chỗ quay lại. */
export const loginPath = (next: string) => `/dang-nhap?next=${encodeURIComponent(safeNext(next))}`;
