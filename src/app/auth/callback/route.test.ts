import { beforeEach, describe, expect, it, vi } from "vitest";

const exchange = vi.fn();
vi.mock("next/headers", () => ({
  cookies: async () => ({ getAll: () => [], set: vi.fn() }),
}));
vi.mock("@supabase/ssr", () => ({
  createServerClient: () => ({ auth: { exchangeCodeForSession: exchange } }),
}));

import { GET } from "./route";

const call = async (query: string) =>
  (await GET(new Request(`https://site.test/auth/callback${query}`))).headers.get("location");

beforeEach(() => {
  exchange.mockReset();
  exchange.mockResolvedValue({ error: null });
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://x.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon");
});

describe("/auth/callback", () => {
  it("đổi mã thành phiên rồi về đúng trang nội bộ", async () => {
    expect(await call("?code=abc&next=%2Feditor%3Fid%3D1")).toBe("https://site.test/editor?id=1");
    expect(exchange).toHaveBeenCalledWith("abc");
  });

  it("không chuyển hướng ra ngoài dù next trỏ site khác", async () => {
    expect(await call("?code=abc&next=%2F%2Fevil.com")).toBe("https://site.test/");
    expect(await call("?code=abc&next=https%3A%2F%2Fevil.com")).toBe("https://site.test/");
  });

  it("mã sai, thiếu mã hoặc link token_hash: về trang đăng nhập, không tạo phiên", async () => {
    exchange.mockResolvedValueOnce({ error: { message: "invalid" } });
    expect(await call("?code=sai")).toBe("https://site.test/dang-nhap?loi=lien-ket");
    expect(await call("?token_hash=abc&type=signup")).toBe(
      "https://site.test/dang-nhap?loi=lien-ket",
    );
    expect(await call("")).toBe("https://site.test/dang-nhap?loi=lien-ket");
  });
});
