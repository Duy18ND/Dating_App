import { describe, expect, it } from "vitest";
import { AFTER_LOGIN, loginPath, safeNext } from "./safe-redirect";

describe("safeNext: chỉ chuyển hướng nội bộ", () => {
  it.each([
    "/editor?id=1&x=2",
    "/thiep-cua-toi/abc#phan-hoi",
    "/",
  ])("giữ đường dẫn nội bộ %s", (path) => {
    expect(safeNext(path)).toBe(path);
  });

  it.each([
    null,
    undefined,
    "",
    "https://evil.com",
    "//evil.com",
    "/\\evil.com",
    "\\\\evil.com",
    "javascript:alert(1)",
    "editor",
    "/\nevil",
    `/${"a".repeat(600)}`,
  ])("chặn %s", (raw) => {
    expect(safeNext(raw)).toBe(AFTER_LOGIN);
  });

  it("ký tự mã hóa vẫn nằm trong site", () => {
    const result = safeNext("/%09/evil.com");
    expect(new URL(result, "https://site.test").origin).toBe("https://site.test");
  });

  it("đường dẫn đăng nhập mã hóa next", () => {
    expect(loginPath("/editor?id=1")).toBe("/dang-nhap?next=%2Feditor%3Fid%3D1");
    expect(loginPath("//evil.com")).toBe(`/dang-nhap?next=${encodeURIComponent(AFTER_LOGIN)}`);
  });
});
