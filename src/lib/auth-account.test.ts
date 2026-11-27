import { describe, expect, it } from "vitest";
import { formatAccountLabel, INTERNAL_USER_DOMAIN, parseAccountIdentifier } from "./auth-account";

describe("auth-account", () => {
  it("chấp nhận tên đăng nhập ký tự thường và chuyển thành email nội bộ", () => {
    const parsed = parseAccountIdentifier("  Duy18_nd  ");
    expect(parsed).toEqual({
      ok: true,
      kind: "username",
      display: "duy18_nd",
      authEmail: `duy18_nd@${INTERNAL_USER_DOMAIN}`,
    });
  });

  it("chặn tên đăng nhập quá ngắn, có dấu, khoảng trắng hoặc ..", () => {
    for (const bad of ["ab", "duy 18", "duy..18", ".duy18", "duy18-", "duyệt"]) {
      expect(parseAccountIdentifier(bad).ok).toBe(false);
    }
  });

  it("vẫn nhận email thật và chặn nhập trực tiếp đuôi nội bộ", () => {
    expect(parseAccountIdentifier("Ban@Gmail.com")).toEqual({
      ok: true,
      kind: "email",
      display: "ban@gmail.com",
      authEmail: "ban@gmail.com",
    });
    expect(parseAccountIdentifier(`duy18@${INTERNAL_USER_DOMAIN}`).ok).toBe(false);
  });

  it("ẩn đuôi nội bộ khi hiển thị tên tài khoản", () => {
    expect(formatAccountLabel(`duy18nd@${INTERNAL_USER_DOMAIN}`)).toBe("duy18nd");
    expect(formatAccountLabel("ban@gmail.com")).toBe("ban@gmail.com");
    expect(formatAccountLabel(undefined)).toBeUndefined();
  });
});
