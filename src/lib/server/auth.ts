import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { hasSessionCookie, supabasePublicConfig } from "@/lib/supabase/config";
import { ApiError } from "./http";

export interface SessionUser {
  id: string;
  email: string | null;
}

async function authClient() {
  const store = await cookies();
  const { url, anonKey } = supabasePublicConfig();
  return createServerClient(url, anonKey, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        // Server Component không ghi được cookie; proxy.ts đã làm mới phiên trước đó.
        try {
          for (const { name, value, options } of list) store.set(name, value, options);
        } catch {}
      },
    },
  });
}

/**
 * Người dùng hiện tại, **xác minh với máy chủ Supabase Auth** (getUser), không tin dữ liệu
 * đọc thẳng từ cookie. Không có cookie phiên thì trả null ngay, không gọi mạng.
 */
export async function getUser(): Promise<SessionUser | null> {
  const store = await cookies();
  if (!hasSessionCookie(store.getAll().map((c) => c.name))) return null;
  const { data, error } = await (await authClient()).auth.getUser();
  if (error || !data.user) return null;
  return { id: data.user.id, email: data.user.email ?? null };
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getUser();
  if (!user) throw new ApiError(401, "Bạn cần đăng nhập để làm việc này");
  return user;
}
