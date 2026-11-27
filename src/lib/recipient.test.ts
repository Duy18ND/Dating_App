import { describe, expect, it } from "vitest";
import { recipientLink, sanitizeRecipient } from "./recipient";

describe("?to=", () => {
  it("đổi gạch ngang thành khoảng trắng, giữ dấu tiếng Việt", () => {
    expect(sanitizeRecipient("Minh-Ánh")).toBe("Minh Ánh");
    expect(sanitizeRecipient(["  Bé   Na ", "khác"])).toBe("Bé Na");
  });

  it("bỏ ký tự có thể dùng để chèn mã", () => {
    expect(sanitizeRecipient('<img src=x onerror="a()">')).not.toMatch(/[<>="]/);
    expect(sanitizeRecipient("‮\u0000<>")).toBe("");
    expect(sanitizeRecipient(undefined)).toBe("");
  });

  it("tối đa 50 ký tự", () => {
    expect([...sanitizeRecipient("ạ".repeat(80))]).toHaveLength(50);
  });

  it("link tạo ra đọc ngược lại đúng tên", () => {
    const link = recipientLink("https://a.test/l/abc123", "Minh Anh & Bố");
    expect(sanitizeRecipient(new URL(link).searchParams.get("to"))).toBe("Minh Anh & Bố");
    expect(recipientLink("https://a.test/l/abc123", "  ")).toBe("https://a.test/l/abc123");
  });
});
