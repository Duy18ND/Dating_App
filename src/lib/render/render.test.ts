import { describe, expect, it } from "vitest";
import { ICONS } from "@/lib/icons";
import { applyFilter, coverCrop } from "./image-frame";
import { isScannableColor, quietZone } from "./qr";

describe("render helpers", () => {
  it("quiet zone luôn >= 12px", () => {
    expect(quietZone(50)).toBe(12);
    expect(quietZone(280)).toBe(28);
  });

  it("chỉ cho màu QR đủ tương phản", () => {
    expect(isScannableColor("#2B2623")).toBe(true);
    expect(isScannableColor("#8E2424")).toBe(true);
    expect(isScannableColor("#C8A882")).toBe(false);
  });

  it("coverCrop cắt giữa và giữ tỷ lệ đích", () => {
    expect(coverCrop(200, 100, 50, 50)).toEqual({ x: 50, y: 0, width: 100, height: 100 });
  });

  it("bộ lọc đen trắng cho 3 kênh bằng nhau và giữ alpha", () => {
    const pixels = new Uint8ClampedArray([200, 100, 50, 123]);
    applyFilter(pixels, "bw");
    expect(pixels[0]).toBe(pixels[1]);
    expect(pixels[1]).toBe(pixels[2]);
    expect(pixels[3]).toBe(123);
  });

  it("đủ 20 icon, id không trùng", () => {
    expect(ICONS).toHaveLength(20);
    expect(new Set(ICONS.map((i) => i.id)).size).toBe(20);
  });
});
