import { describe, expect, it } from "vitest";
import { PRINT_CONFIG } from "@/lib/print-config";
import { samplePayload } from "@/lib/test-fixtures";
import { letterPayloadSchema, responseSchema } from "@/lib/validation";
import type { CanvasElement } from "@/types/letter";

const image = (id: string, src: string): CanvasElement => ({
  id, type: "image", src, x: 0, y: 0, width: 100, height: 100, rotation: 0, zIndex: 0,
});
const ok = (value: unknown) => letterPayloadSchema.safeParse(value).success;

describe("letterPayloadSchema", () => {
  it("nhận thư mẫu hợp lệ", () => expect(ok(samplePayload())).toBe(true));

  it("khóa cứng canvas 1240x1754", () => {
    const p = samplePayload();
    expect(ok({ ...p, canvas_data: { ...p.canvas_data, width: 1000 } })).toBe(false);
  });

  it("mặc định khổ A6", () => {
    const p = samplePayload() as unknown as { canvas_data: { defaultPrintSize?: string } };
    delete p.canvas_data.defaultPrintSize;
    expect(letterPayloadSchema.parse(p).canvas_data.defaultPrintSize).toBe("A6");
  });

  it("tối đa 4 ảnh, tính cả ảnh nền", () => {
    const p = samplePayload();
    p.canvas_data.elements = [1, 2, 3, 4].map((n) => image(`i${n}`, `https://cdn.test/${n}.webp`));
    expect(ok(p)).toBe(true);
    p.canvas_data.background = { type: "image", value: "https://cdn.test/bg.webp", overlayOpacity: 0.35 };
    expect(ok(p)).toBe(false);
  });

  it("chặn QR nhỏ hơn mức tối thiểu", () => {
    const p = samplePayload();
    p.canvas_data.elements[1].width = p.canvas_data.elements[1].height = 239;
    expect(ok(p)).toBe(false);
  });

  it("chặn link bản đồ javascript:", () => {
    const p = samplePayload();
    p.web_config.blocks.rsvp = {
      enabled: false, eventDate: "", locationName: "", mapsUrl: "javascript:alert(1)",
    };
    expect(ok(p)).toBe(false);
  });

  it("chặn trường lạ và sticker ngoài kho", () => {
    expect(ok({ ...samplePayload(), edit_token: "x" })).toBe(false);
    const p = samplePayload();
    p.canvas_data.elements = [{ ...image("s", "https://evil.test/a.webp"), type: "sticker_img" }];
    expect(ok(p)).toBe(false);
  });
});

describe("responseSchema", () => {
  it("kiểm tra status theo loại hành động", () => {
    expect(responseSchema.safeParse({ action_type: "accept", status: "yes" }).success).toBe(true);
    expect(responseSchema.safeParse({ action_type: "accept", status: "attending" }).success).toBe(false);
  });
});

describe("PRINT_CONFIG", () => {
  const { PAPER_A4_MM: a4, CARD_SIZES_MM, ENVELOPE_C6_FLAT_MM: envelope } = PRINT_CONFIG;

  it("thiệp được căn giữa A4", () => {
    for (const card of Object.values(CARD_SIZES_MM)) {
      expect(card.offsetX * 2 + card.width).toBe(a4.width);
      expect(card.offsetY * 2 + card.height).toBe(a4.height);
    }
  });

  it("phôi C6 trải phẳng lọt A4 đúng lề", () => {
    expect(envelope.bodyWidth + 2 * envelope.sideFlap + 2 * envelope.marginX).toBe(a4.width);
    expect(envelope.bodyHeight + envelope.topFlap + envelope.bottomFlap + 2 * envelope.marginY).toBe(
      a4.height,
    );
  });
});
