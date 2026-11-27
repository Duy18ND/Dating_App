"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabasePublicConfig } from "./config";

let client: SupabaseClient | undefined;

/** Supabase phía trình duyệt: CHỈ dùng cho đăng nhập. Phiên lưu trong cookie để server đọc được. */
export function authBrowser(): SupabaseClient {
  if (!client) {
    const { url, anonKey } = supabasePublicConfig();
    client = createBrowserClient(url, anonKey);
  }
  return client;
}

/** URL quay về sau khi bấm link trong email hoặc đăng nhập Google. */
export const callbackUrl = (next: string) =>
  `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
