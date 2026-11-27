import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { safeNext } from "@/lib/safe-redirect";
import { supabasePublicConfig } from "@/lib/supabase/config";

/**
 * Đích quay về của Google OAuth, link xác nhận email và link đặt lại mật khẩu.
 * Đổi mã lấy phiên (ghi cookie) rồi chuyển tới `next` (chỉ đường dẫn nội bộ).
 *
 * Chỉ nhận luồng PKCE (?code=): mã chỉ đổi được khi trình duyệt này giữ code_verifier do
 * chính nó tạo lúc bấm đăng nhập/đăng ký. Không nhận ?token_hash=, vì link như vậy do người
 * khác gửi sẽ đăng nhập nạn nhân vào tài khoản của kẻ gửi (login CSRF).
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const next = safeNext(url.searchParams.get("next"));
  const code = url.searchParams.get("code");
  const fail = () => NextResponse.redirect(new URL("/dang-nhap?loi=lien-ket", url.origin));
  if (!code) return fail();

  const store = await cookies();
  const { url: supabaseUrl, anonKey } = supabasePublicConfig();
  const supabase = createServerClient(supabaseUrl, anonKey, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        for (const { name, value, options } of list) store.set(name, value, options);
      },
    },
  });
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return fail();
  return NextResponse.redirect(new URL(next, url.origin));
}
