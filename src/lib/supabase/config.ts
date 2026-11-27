// Khóa công khai của Supabase Auth: dùng được ở cả trình duyệt lẫn server.
// Bảng dữ liệu vẫn khóa bằng RLS không có policy; trình duyệt chỉ dùng Supabase để đăng nhập.

export function supabasePublicConfig(): { url: string; anonKey: string } {
  // Viết thẳng tên biến để Next.js nhúng giá trị vào bundle trình duyệt.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error("Thiếu NEXT_PUBLIC_SUPABASE_URL hoặc NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }
  return { url, anonKey };
}

/** Cookie phiên của Supabase có dạng sb-<project>-auth-token (có thể chia .0, .1). */
export const hasSessionCookie = (names: Iterable<string>) =>
  [...names].some((name) => name.startsWith("sb-") && name.includes("-auth-token"));
