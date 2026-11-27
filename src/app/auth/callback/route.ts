import { createServerClient } from "@supabase/ssr";
import type { EmailOtpType } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { safeNext } from "@/lib/safe-redirect";
import { supabasePublicConfig } from "@/lib/supabase/config";

const OTP_TYPES: EmailOtpType[] = ["signup", "recovery", "email", "email_change", "invite", "magiclink"];

/**
 * Đích quay về của Google OAuth, link xác nhận email và link đặt lại mật khẩu.
 * Đổi mã lấy phiên (ghi cookie) rồi chuyển tới `next` (chỉ đường dẫn nội bộ).
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const next = safeNext(url.searchParams.get("next"));
  const fail = () => NextResponse.redirect(new URL("/dang-nhap?loi=lien-ket", url.origin));

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

  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) return fail();
  } else if (tokenHash && type && OTP_TYPES.includes(type)) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (error) return fail();
  } else {
    return fail();
  }
  return NextResponse.redirect(new URL(next, url.origin));
}
