import { describe, expect, it } from "vitest";
import {
  authErrorMessage,
  formatAccountLabel,
  INTERNAL_USER_DOMAIN,
  parseAccountIdentifier,
} from "./auth-account";

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

describe("authErrorMessage", () => {
  it("đăng nhập sai không cho biết tài khoản có tồn tại", () => {
    expect(authErrorMessage("Invalid login credentials", "login", "email")).toBe(
      "Tên đăng nhập hoặc mật khẩu không đúng.",
    );
  });

  it("provider bị tắt thì báo máy chủ, không đổ lỗi mật khẩu", () => {
    for (const raw of ["Email logins are disabled", "Email signups are disabled"]) {
      expect(authErrorMessage(raw, "login", "username")).toContain("tạm tắt");
      expect(authErrorMessage(raw, "signup", "username")).toContain("tạm tắt");
    }
  });

  it("đăng ký trùng: tên đăng nhập báo đã dùng, email không khẳng định đã tồn tại", () => {
    expect(authErrorMessage("User already registered", "signup", "username")).toContain("đã có");
    expect(authErrorMessage("User already registered", "signup", "email")).toContain("Nếu bạn");
  });

  it("không bao giờ nhắc tới cấu hình Supabase", () => {
    for (const raw of ["Email not confirmed", "something odd", "Password is too weak"]) {
      expect(authErrorMessage(raw, "signup", "email")).not.toMatch(/supabase/i);
    }
  });
});
