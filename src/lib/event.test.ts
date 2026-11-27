import { describe, expect, it } from "vitest";
import { formatEventDate, mapsLink } from "./event";

describe("thông tin sự kiện", () => {
  it("giữ nguyên giờ người gửi nhập", () => {
    expect(formatEventDate("2027-01-10T17:30")).toBe("17:30, Chủ Nhật, 10/01/2027");
  });

  it("không bao giờ trả link javascript:", () => {
    expect(mapsLink("javascript:alert(1)", "Quán A")).toMatch(/^https:\/\/www\.google\.com\/maps/);
    expect(mapsLink("https://maps.app.goo.gl/x", "Quán A")).toBe("https://maps.app.goo.gl/x");
  });
});
