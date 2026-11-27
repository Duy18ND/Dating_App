import { describe, expect, it } from "vitest";
import { findIcon } from "@/lib/icons";
import { PRINT_CONFIG } from "@/lib/print-config";
import { isScannableColor, quietZone } from "@/lib/render/qr";
import { TEXT_DEFAULTS } from "@/lib/render/text";
import { letterPayloadSchema } from "@/lib/validation";
import { FACE_IDS, TEMPLATE_TYPES } from "@/types/letter";
import { createFromTemplate, TEMPLATES } from "./templates";

const { width: W, height: H, safeMarginPx: M, minFontPx } = PRINT_CONFIG.CANVAS;

describe("4 mẫu thư", () => {
  it("đủ 4 loại", () => {
    expect(TEMPLATES.map((t) => t.type).sort()).toEqual([...TEMPLATE_TYPES].sort());
  });

  it.each(TEMPLATE_TYPES)("%s: qua validation, hai mặt nằm trong lề an toàn", (type) => {
    const payload = createFromTemplate(type);
    const result = letterPayloadSchema.safeParse(payload);
    expect(result.error?.issues).toBeUndefined();

    const { faces } = payload.canvas_data;
    // Mã QR duy nhất nằm ở trang Lời mời.
    const codes = faces.inside.elements.filter((el) => el.type === "qr_code");
    expect(codes).toHaveLength(1);
    expect(isScannableColor(codes[0].fill!)).toBe(true);
    expect(faces.front.elements.length).toBeGreaterThan(0);

    for (const el of FACE_IDS.flatMap((face) => faces[face].elements)) {
      if (el.type === "text") expect(el.fontSize, el.id).toBeGreaterThanOrEqual(minFontPx);
      // Mã QR tính cả thẻ nền sáng. Chiều cao chữ ước lượng theo số dòng viết sẵn.
      const pad = el.type === "qr_code" ? quietZone(el.width!) : 0;
      const height =
        el.height ?? (el.text?.split("\n").length ?? 1) * el.fontSize! * TEXT_DEFAULTS.lineHeight;
      expect(el.x - pad, el.id).toBeGreaterThanOrEqual(M);
      expect(el.y - pad, el.id).toBeGreaterThanOrEqual(M);
      expect(el.x + el.width! + pad, el.id).toBeLessThanOrEqual(W - M);
      expect(el.y + height + pad, el.id).toBeLessThanOrEqual(H - M);
      if (el.iconId) expect(findIcon(el.iconId), el.iconId).toBeDefined();
    }
  });

  it("mỗi lần tạo là một bản sao độc lập", () => {
    const first = createFromTemplate("dinner");
    first.web_config.blocks.poll!.options.push("Khác");
    expect(createFromTemplate("dinner").web_config.blocks.poll!.options).toHaveLength(3);
  });
});
