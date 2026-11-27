import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { loginPath } from "@/lib/safe-redirect";
import { hasSessionCookie } from "@/lib/supabase/config";

/**
 * 1. Làm mới phiên Supabase (Server Component không tự ghi được cookie).
 * 2. Chặn sớm trang bắt buộc đăng nhập, chuyển tới /dang-nhap?next=... (kiểm tra lạc quan).
 * Quyền thật nằm ở API: mọi route /api/me/* tự xác minh phiên với Supabase và lọc theo chủ.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  let signedIn = false;
  if (url && anonKey && hasSessionCookie(request.cookies.getAll().map((c) => c.name))) {
    const supabase = createServerClient(url, anonKey, {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (list) => {
          for (const { name, value } of list) request.cookies.set(name, value);
          response = NextResponse.next({ request });
          for (const { name, value, options } of list) response.cookies.set(name, value, options);
        },
      },
    });
    // getClaims kiểm tra chữ ký JWT (và làm mới phiên nếu hết hạn).
    const { data } = await supabase.auth.getClaims();
    signedIn = Boolean(data?.claims?.sub);
  }

  if (!signedIn) {
    const { pathname, search } = request.nextUrl;
    const target = request.nextUrl.clone();
    const login = new URL(loginPath(`${pathname}${search}`), request.url);
    target.pathname = login.pathname;
    target.search = login.search;
    const redirect = NextResponse.redirect(target);
    // Giữ cookie vừa làm mới (nếu có) khi chuyển hướng.
    for (const cookie of response.cookies.getAll()) redirect.cookies.set(cookie);
    return redirect;
  }
  return response;
}

export const config = {
  matcher: ["/editor/:path*", "/thiep-cua-toi/:path*", "/doi-mat-khau"],
};
