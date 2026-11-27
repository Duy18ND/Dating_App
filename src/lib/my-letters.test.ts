import { describe, expect, it } from "vitest";
import { daysLeft, expiryState, letterNames } from "./my-letters";

const NOW = Date.parse("2026-11-27T12:00:00Z");
const inDays = (days: number) => new Date(NOW + days * 86_400_000).toISOString();

describe("hạn của thiệp", () => {
  it("làm tròn lên số ngày còn lại", () => {
    expect(daysLeft(inDays(60), NOW)).toBe(60);
    expect(daysLeft(inDays(0.2), NOW)).toBe(1);
    expect(daysLeft(inDays(-1), NOW)).toBe(0);
  });

  it("cảnh báo khi còn từ 7 ngày trở xuống", () => {
    expect(expiryState(inDays(8), NOW)).toEqual({ days: 8, expired: false, warning: false });
    expect(expiryState(inDays(7), NOW).warning).toBe(true);
    expect(expiryState(inDays(1), NOW).warning).toBe(true);
    expect(expiryState(inDays(-0.1), NOW)).toEqual({ days: 0, expired: true, warning: false });
  });
});

describe("tên thiệp", () => {
  it("dùng tiêu đề, trống thì đánh số theo thứ tự tạo", () => {
    const newestFirst = [
      { id: "c", title: "", created_at: "2026-11-03" },
      { id: "b", title: "Mời cưới", created_at: "2026-11-02" },
      { id: "a", title: "  ", created_at: "2026-11-01" },
    ];
    const names = letterNames(newestFirst);
    expect(names.get("a")).toBe("Thiệp 1");
    expect(names.get("b")).toBe("Mời cưới");
    expect(names.get("c")).toBe("Thiệp 3");
  });
});
