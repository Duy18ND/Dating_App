import { describe, expect, it } from "vitest";
import { PRINT_CONFIG } from "@/lib/print-config";
import { letterSheet } from "./layout";
import {
  dotColumns,
  fitText,
  flapWidthAt,
  letterRows,
  MARGIN_X_MM,
  panelRows,
  resolveEnvelopeFront,
  resolveGreeting,
  wrapWords,
} from "./guides";

const { lineGap, panelHeight } = PRINT_CONFIG.LETTER_MM;

describe("thư gấp 3", () => {
  it("dòng kẻ cách 8 mm và cách vạch gấp ít nhất 5 mm", () => {
    const { rect, folds } = letterSheet();
    const rows = letterRows(false, false).writing;
    for (const fold of folds.map((y) => y - rect.y)) {
      for (const y of rows) expect(Math.abs(y - fold)).toBeGreaterThanOrEqual(5);
    }
    const first = panelRows(0);
    expect(first[1] - first[0]).toBe(lineGap);
    expect(Math.max(...first)).toBeLessThan(panelHeight);
  });

  it("lời chào và chữ ký chiếm dòng đầu, dòng cuối; còn lại để viết", () => {
    const empty = letterRows(false, false);
    const filled = letterRows(true, true);
    expect(empty.writing).toHaveLength(24);
    expect(filled.writing).toHaveLength(22);
    expect(filled.writing).not.toContain(filled.greetingY);
    expect(filled.writing).not.toContain(filled.signatureY);
  });

  it("chấm bi canh giữa trong lề", () => {
    const columns = dotColumns(105);
    expect(columns[0]).toBeGreaterThanOrEqual(MARGIN_X_MM);
    expect(columns.at(-1)!).toBeLessThanOrEqual(105 - MARGIN_X_MM);
    expect(columns[0] + columns.at(-1)!).toBeCloseTo(105);
  });

  it("lời chào mặc định thêm tên người nhận, đã sửa thì giữ nguyên", () => {
    expect(resolveGreeting("Gửi", "Minh Anh")).toBe("Gửi Minh Anh,");
    expect(resolveGreeting("Gửi", "")).toBe("Gửi");
    expect(resolveGreeting("Cậu ơi,", "Minh Anh")).toBe("Cậu ơi,");
    expect(resolveGreeting("   ", "Minh Anh")).toBe("");
  });
});

describe("mặt trước phong bì", () => {
  it("mặc định ghi Gửi kèm tên; chưa có tên thì để trơn", () => {
    expect(resolveEnvelopeFront(undefined, "Minh Anh")).toBe("Gửi Minh Anh");
    expect(resolveEnvelopeFront("Gửi", " Minh Anh ")).toBe("Gửi Minh Anh");
    expect(resolveEnvelopeFront(undefined, "")).toBe("");
  });

  it("chữ tự đặt được giữ nguyên, xóa trống thì không in", () => {
    expect(resolveEnvelopeFront("Cho người thương", "Minh Anh")).toBe("Cho người thương");
    expect(resolveEnvelopeFront("  ", "Minh Anh")).toBe("");
  });
});

describe("co chữ cho vừa khung", () => {
  const measure = (text: string) => text.length;

  it("xuống dòng theo bề rộng riêng của từng dòng", () => {
    expect(wrapWords("aa bb cc", [5, 2], measure)).toEqual(["aa bb", "cc"]);
    expect(wrapWords("aa bb cc", [5], measure)).toBeNull();
    expect(wrapWords("qua-dai-khong-tach-duoc", [5, 5], measure)).toBeNull();
  });

  it("giảm cỡ tới khi vừa, không vừa thì dừng ở cỡ nhỏ nhất", () => {
    const at = (size: number) => (text: string) => text.length * size;
    expect(fitText("aaaa", [8], { max: 4, min: 1, step: 1 }, at)).toEqual({
      size: 2,
      lines: ["aaaa"],
    });
    expect(fitText("aaaaaaaaaaaa", [8], { max: 4, min: 1, step: 1 }, at).size).toBe(1);
  });

  it("nắp phong bì hẹp dần về mũi", () => {
    expect(flapWidthAt(0)).toBe(114);
    expect(flapWidthAt(22.5)).toBeCloseTo(57);
    expect(flapWidthAt(60)).toBe(0);
  });
});
