import { describe, expect, it } from "vitest";
import { PRINT_CONFIG } from "@/lib/print-config";
import { samplePayload } from "@/lib/test-fixtures";
import { collectUserImageUrls, letterPayloadSchema, responseSchema } from "@/lib/validation";
import type { CanvasElement } from "@/types/letter";

const image = (id: string, src: string): CanvasElement => ({
  id,
  type: "image",
  src,
  x: 0,
  y: 0,
  width: 100,
  height: 100,
  rotation: 0,
  zIndex: 0,
});
const ok = (value: unknown) => letterPayloadSchema.safeParse(value).success;

describe("letterPayloadSchema", () => {
  it("nhận thư mẫu hợp lệ", () => expect(ok(samplePayload())).toBe(true));

  it("khóa cứng mặt thiệp 1760x1240 và phiên bản 2", () => {
    const p = samplePayload();
    expect(ok({ ...p, canvas_data: { ...p.canvas_data, width: 1240 } })).toBe(false);
    expect(ok({ ...p, canvas_data: { ...p.canvas_data, version: 1 } })).toBe(false);
  });

  it("từ chối dữ liệu khổ cũ (một mặt, có defaultPrintSize)", () => {
    const old = {
      ...samplePayload(),
      canvas_data: {
        width: 1240,
        height: 1754,
        defaultPrintSize: "A6",
        background: { type: "preset", value: "cream", overlayOpacity: 0 },
        elements: [],
      },
    };
    expect(ok(old)).toBe(false);
  });

  it("tối đa 4 ảnh tính trên cả hai mặt, kể cả ảnh nền", () => {
    const p = samplePayload();
    p.canvas_data.faces.front.elements = [1, 2].map((n) =>
      image(`f${n}`, `https://cdn.test/${n}.webp`),
    );
    p.canvas_data.faces.inside.elements.push(
      ...[3, 4].map((n) => image(`i${n}`, `https://cdn.test/${n}.webp`)),
    );
    expect(ok(p)).toBe(true);
    expect(collectUserImageUrls(p.canvas_data)).toHaveLength(4);
    p.canvas_data.faces.inside.background = {
      type: "image",
      value: "https://cdn.test/bg.webp",
      overlayOpacity: 0.35,
    };
    expect(ok(p)).toBe(false);
  });

  it("id không được trùng giữa hai mặt", () => {
    const p = samplePayload();
    p.canvas_data.faces.front.elements.push({
      ...p.canvas_data.faces.inside.elements[0],
      type: "text",
      text: "x",
      fontSize: 64,
    });
    expect(ok(p)).toBe(false);
  });

  it("mã QR chỉ ở trang Lời mời, tối đa một mã, không nhỏ hơn mức tối thiểu", () => {
    const qr = samplePayload().canvas_data.faces.inside.elements[0];
    const onFront = samplePayload();
    onFront.canvas_data.faces.front.elements.push({ ...qr, id: "q2" });
    onFront.canvas_data.faces.inside.elements = [];
    expect(ok(onFront)).toBe(false);

    const twice = samplePayload();
    twice.canvas_data.faces.inside.elements.push({ ...qr, id: "q2" });
    expect(ok(twice)).toBe(false);

    const small = samplePayload();
    small.canvas_data.faces.inside.elements[0].width = PRINT_CONFIG.CANVAS.minQrPx - 1;
    small.canvas_data.faces.inside.elements[0].height = PRINT_CONFIG.CANVAS.minQrPx - 1;
    expect(ok(small)).toBe(false);
  });

  it("chữ trên thiệp không nhỏ hơn cỡ tối thiểu", () => {
    const p = samplePayload();
    p.canvas_data.faces.front.elements[0].fontSize = PRINT_CONFIG.CANVAS.minFontPx - 1;
    expect(ok(p)).toBe(false);
  });

  it("giới hạn chữ lồng phong bì theo ký tự hiển thị", () => {
    const p = samplePayload();
    p.canvas_data.envelope.monogram = "♡".repeat(12);
    expect(ok(p)).toBe(true);
    p.canvas_data.envelope.monogram = "♡".repeat(13);
    expect(ok(p)).toBe(false);
  });

  it("chặn link bản đồ javascript:", () => {
    const p = samplePayload();
    p.web_config.blocks.rsvp = {
      enabled: false,
      eventDate: "",
      locationName: "",
      mapsUrl: "javascript:alert(1)",
    };
    expect(ok(p)).toBe(false);
  });

  it("chặn trường lạ và sticker ngoài kho", () => {
    expect(ok({ ...samplePayload(), edit_token: "x" })).toBe(false);
    const p = samplePayload();
    p.canvas_data.faces.front.elements = [
      { ...image("s", "https://evil.test/a.webp"), type: "sticker_img" },
    ];
    expect(ok(p)).toBe(false);
  });
});

describe("responseSchema", () => {
  it("kiểm tra status theo loại hành động", () => {
    expect(responseSchema.safeParse({ action_type: "accept", status: "yes" }).success).toBe(true);
    expect(responseSchema.safeParse({ action_type: "accept", status: "attending" }).success).toBe(
      false,
    );
  });
});

describe("PRINT_CONFIG", () => {
  const {
    PAPER_A4_MM: a4,
    CANVAS,
    CARD_FACE_MM,
    CARD_STRIPS_MM: strips,
    ENVELOPE_C7_FLAT_MM: env,
  } = PRINT_CONFIG;

  it("canvas logic cùng tỷ lệ với mặt thiệp 105 x 74 mm", () => {
    expect(CANVAS.width / CANVAS.height).toBeCloseTo(CARD_FACE_MM.width / CARD_FACE_MM.height, 2);
  });

  it("phong bì C7 và hai dải thiệp căn giữa A4", () => {
    expect(2 * env.offsetX + env.bodyWidth + 2 * env.sideFlap).toBe(a4.width);
    expect(2 * env.offsetY + env.topFlap + env.bodyHeight + env.bottomFlap).toBe(a4.height);
    expect(2 * strips.marginX + 2 * strips.height + strips.gap).toBe(a4.width);
    expect(2 * strips.y + strips.length).toBe(a4.height);
    expect(strips.length).toBe(2 * CARD_FACE_MM.width);
  });

  it("QR tối thiểu in ra rộng ít nhất 20 mm", () => {
    expect((CANVAS.minQrPx / CANVAS.width) * CARD_FACE_MM.width).toBeGreaterThanOrEqual(20);
  });
});
