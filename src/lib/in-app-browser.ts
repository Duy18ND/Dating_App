/**
 * Trình duyệt nhúng trong app (Threads, Messenger, Facebook, Instagram, Zalo, TikTok, LINE,
 * WeChat...): Google chặn đăng nhập OAuth ở đây (lỗi "disallowed_useragent"), nên ẩn nút
 * Google và hướng dẫn mở bằng Chrome/Safari (FR-14). Đăng nhập email vẫn dùng được.
 */
const IN_APP_PATTERNS = [
  /FBAN|FBAV|FB_IAB|FBIOS|FB4A/i, // Facebook, Messenger
  /Instagram/i,
  /Barcelona/i, // Threads (tên mã trong user agent)
  /Threads/i,
  /Zalo/i,
  /musical_ly|TikTok|BytedanceWebview/i,
  /\bLine\//i,
  /MicroMessenger/i, // WeChat
  /; wv\)/i, // Android WebView nói chung
];

export function isInAppBrowser(userAgent: string | null | undefined): boolean {
  if (!userAgent) return false;
  return IN_APP_PATTERNS.some((pattern) => pattern.test(userAgent));
}
