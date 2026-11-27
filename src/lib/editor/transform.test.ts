import { describe, expect, it } from "vitest";
import type { CanvasElement } from "@/types/letter";
import { normalizeAngle, pinchPatch, scalePatch } from "./transform";

const el = (patch: Partial<CanvasElement>): CanvasElement => ({
  id: "a",
  type: "image",
  x: 100,
  y: 100,
  width: 200,
  height: 100,
  rotation: 0,
  zIndex: 0,
  ...patch,
});

describe("scalePatch", () => {
  it("ảnh, sticker, icon giữ tỷ lệ gốc khi kéo giãn (FR-16)", () => {
    expect(scalePatch(el({ type: "image", width: 200, height: 100 }), 2, 0.5)).toEqual({
      width: 400,
      height: 200,
    });
    expect(scalePatch(el({ type: "sticker_img", width: 300, height: 300 }), 1.2, 1.5)).toEqual({
      width: 450,
      height: 450,
    });
    expect(scalePatch(el({ type: "svg_icon", width: 120, height: 120 }), 0.5, 1.1)).toEqual({
      width: 60,
      height: 60,
    });
  });

  it("vùng dòng kẻ (lined_area) co giãn tự do hai chiều", () => {
    expect(scalePatch(el({ type: "lined_area", width: 200, height: 100 }), 2, 0.5)).toEqual({
      width: 400,
      height: 50,
    });
  });

  it("chữ đổi bề rộng khung và cỡ chữ", () => {
    expect(scalePatch(el({ type: "text", width: 500, fontSize: 40 }), 1.5, 2)).toEqual({
      width: 750,
      fontSize: 80,
    });
  });

  it("nét vẽ co giãn đồng đều giữ tỷ lệ (FR-16)", () => {
    expect(scalePatch(el({ type: "handwriting", points: [0, 0, 10, 20] }), 1.2, 3)).toEqual({
      points: [0, 0, 30, 60],
    });
  });

  it("QR luôn vuông và không nhỏ hơn 340px", () => {
    expect(scalePatch(el({ type: "qr_code", width: 380, height: 380 }), 0.5, 0.3)).toEqual({
      width: 340,
      height: 340,
    });
  });

  it("chữ không thu nhỏ dưới cỡ tối thiểu khi in", () => {
    expect(scalePatch(el({ type: "text", width: 500, fontSize: 60 }), 1, 0.1).fontSize).toBe(48);
  });
});

describe("pinchPatch", () => {
  it("phóng to giữ nguyên tâm", () => {
    const patch = pinchPatch(el({}), { width: 200, height: 100 }, 2, 0);
    // Tâm (200, 150) giữ nguyên; khung mới 400x200 nên góc trên trái là (0, 50).
    expect(patch).toMatchObject({ x: 0, y: 50, width: 400, height: 200, rotation: 0 });
  });

  it("xoay 180 độ quanh tâm", () => {
    const patch = pinchPatch(el({}), { width: 200, height: 100 }, 1, 180);
    expect(patch.rotation).toBe(180);
    expect(patch.x).toBeCloseTo(300);
    expect(patch.y).toBeCloseTo(200);
  });

  it("chuẩn hóa góc", () => {
    expect(normalizeAngle(370)).toBe(10);
    expect(normalizeAngle(-190)).toBe(170);
  });
});
