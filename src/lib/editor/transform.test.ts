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
  it("ảnh đổi kích thước theo từng chiều", () => {
    expect(scalePatch(el({}), 2, 0.5)).toEqual({ width: 400, height: 50 });
  });

  it("chữ đổi bề rộng khung và cỡ chữ", () => {
    expect(scalePatch(el({ type: "text", width: 500, fontSize: 40 }), 1.5, 2)).toEqual({
      width: 750,
      fontSize: 80,
    });
  });

  it("nét vẽ co giãn tọa độ điểm", () => {
    expect(scalePatch(el({ type: "handwriting", points: [0, 0, 10, 20] }), 2, 3)).toEqual({
      points: [0, 0, 20, 60],
    });
  });

  it("QR luôn vuông và không nhỏ hơn 240px", () => {
    expect(scalePatch(el({ type: "qr_code", width: 280, height: 280 }), 0.5, 0.3)).toEqual({
      width: 240,
      height: 240,
    });
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
