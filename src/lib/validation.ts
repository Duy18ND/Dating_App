import { z } from "zod";
import { FONT_NAMES } from "@/lib/font-names";
import { PRINT_CONFIG } from "@/lib/print-config";
import {
  BACKGROUND_PRESETS,
  ELEMENT_TYPES,
  FACE_IDS,
  IMAGE_FILTERS,
  IMAGE_FRAMES,
  PAPER_STYLES,
  TEMPLATE_TYPES,
  type CanvasData,
  type LetterPayload,
} from "@/types/letter";

export const LIMITS = {
  maxUserImages: 4,
  maxElements: 300,
  maxPointNumbers: 4000,
  maxBodyBytes: 1_000_000,
  maxNameLength: 50,
  maxTextLength: 2000,
  maxMonogram: 12,
  maxEnvelopeLine: 80,
  maxLetterLine: 60,
} as const;

export function isHttpUrl(value: string): boolean {
  try {
    return ["http:", "https:"].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}

const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Màu phải có dạng #RRGGBB");
const coordinate = z.number().min(-5000).max(7000);
const size = z.number().positive().max(7000);

export const backgroundSchema = z
  .strictObject({
    type: z.enum(["preset", "color", "image"]),
    value: z.string().min(1).max(500),
    overlayColor: hexColor.optional(),
    overlayOpacity: z.number().min(0).max(0.8),
    blur: z.number().min(0).max(10).optional(),
  })
  .superRefine((bg, ctx) => {
    const ok =
      bg.type === "preset"
        ? (BACKGROUND_PRESETS as readonly string[]).includes(bg.value)
        : bg.type === "color"
          ? hexColor.safeParse(bg.value).success
          : isHttpUrl(bg.value);
    if (!ok) ctx.addIssue({ code: "custom", path: ["value"], message: "Giá trị nền không hợp lệ" });
  });

export const elementSchema = z
  .strictObject({
    id: z.string().min(1).max(40),
    type: z.enum(ELEMENT_TYPES),
    x: coordinate,
    y: coordinate,
    width: size.optional(),
    height: size.optional(),
    rotation: z.number().min(-360).max(360),
    zIndex: z.number().int().min(0).max(10_000),
    locked: z.boolean().optional(),
    text: z.string().max(LIMITS.maxTextLength).optional(),
    fontFamily: z.enum(FONT_NAMES).optional(),
    fontSize: z.number().min(PRINT_CONFIG.CANVAS.minFontPx).max(600).optional(),
    fill: hexColor.optional(),
    align: z.enum(["left", "center", "right"]).optional(),
    src: z.string().max(500).optional(),
    frame: z.enum(IMAGE_FRAMES).optional(),
    filter: z.enum(IMAGE_FILTERS).optional(),
    iconId: z.string().max(60).optional(),
    points: z.array(coordinate).max(LIMITS.maxPointNumbers).optional(),
    strokeWidth: z.number().min(2).max(8).optional(),
    lineStyle: z.enum(["ruled", "dot_grid"]).optional(),
  })
  .superRefine((el, ctx) => {
    const fail = (path: string, message: string) =>
      ctx.addIssue({ code: "custom", path: [path], message });
    const needsBox = el.type !== "text" && el.type !== "handwriting";
    if (needsBox && (el.width === undefined || el.height === undefined)) {
      fail("width", "Thiếu kích thước");
    }
    if (el.type === "text" && el.text === undefined) fail("text", "Thiếu nội dung chữ");
    if ((el.type === "image" || el.type === "sticker_img") && !el.src) fail("src", "Thiếu ảnh");
    if (el.type === "svg_icon" && !el.iconId) fail("iconId", "Thiếu icon");
    if (el.type === "handwriting" && (!el.points || el.points.length < 2 || el.points.length % 2)) {
      fail("points", "Nét vẽ không hợp lệ");
    }
    if (el.type === "qr_code") {
      const min = PRINT_CONFIG.CANVAS.minQrPx;
      if ((el.width ?? 0) < min || el.width !== el.height) {
        fail("width", `Mã QR phải vuông và từ ${min}px trở lên`);
      }
    }
    if (el.type === "sticker_img" && el.src && !/^\/stickers\/[\w\-/]+\.webp$/.test(el.src)) {
      fail("src", "Sticker phải nằm trong kho có sẵn");
    }
    if (el.type === "image" && el.src && !isHttpUrl(el.src)) fail("src", "URL ảnh không hợp lệ");
  });

const allElements = (canvas: CanvasData) => FACE_IDS.flatMap((face) => canvas.faces[face].elements);

/** Các URL ảnh người dùng tải lên trên cả hai mặt thiệp (ảnh và ảnh nền), đã bỏ trùng. */
export function collectUserImageUrls(canvas: CanvasData): string[] {
  const urls = allElements(canvas).flatMap((el) => (el.type === "image" && el.src ? [el.src] : []));
  for (const face of FACE_IDS) {
    const background = canvas.faces[face].background;
    if (background.type === "image") urls.push(background.value);
  }
  return [...new Set(urls)];
}

const faceSchema = z.strictObject({
  background: backgroundSchema,
  elements: z.array(elementSchema).max(LIMITS.maxElements),
});

/** Đếm theo ký tự hiển thị để emoji và chữ có dấu tính là 1. */
const shortText = (max: number) =>
  z.string().refine((value) => [...value].length <= max, `Tối đa ${max} ký tự`);

export const canvasDataSchema = z
  .strictObject({
    version: z.literal(2),
    width: z.literal(PRINT_CONFIG.CANVAS.width),
    height: z.literal(PRINT_CONFIG.CANVAS.height),
    faces: z.strictObject({ front: faceSchema, inside: faceSchema }),
    writingPage: z.strictObject({ paper: z.enum(PAPER_STYLES), color: hexColor }),
    letter: z.strictObject({
      paper: z.enum(PAPER_STYLES),
      greeting: shortText(LIMITS.maxLetterLine),
      signature: shortText(LIMITS.maxLetterLine),
      fontFamily: z.enum(FONT_NAMES),
      inkColor: hexColor,
      paperColor: hexColor,
      decorIconId: z.string().max(60).optional(),
    }),
    envelope: z.strictObject({
      monogram: shortText(LIMITS.maxMonogram),
      line: shortText(LIMITS.maxEnvelopeLine),
      fontFamily: z.enum(FONT_NAMES),
    }),
  })
  .superRefine((canvas, ctx) => {
    const fail = (path: (string | number)[], message: string) =>
      ctx.addIssue({ code: "custom", path, message });
    const elements = allElements(canvas);
    if (elements.length > LIMITS.maxElements) {
      fail(["faces"], `Thiệp tối đa ${LIMITS.maxElements} thành phần`);
    }
    if (new Set(elements.map((el) => el.id)).size !== elements.length) {
      fail(["faces"], "Trùng id phần tử");
    }
    if (collectUserImageUrls(canvas).length > LIMITS.maxUserImages) {
      fail(["faces"], `Mỗi thiệp tối đa ${LIMITS.maxUserImages} ảnh tải lên`);
    }
    // Mã QR chỉ nằm ở trang Lời mời, và chỉ một mã.
    if (canvas.faces.front.elements.some((el) => el.type === "qr_code")) {
      fail(["faces", "front"], "Mã QR chỉ đặt ở trang Lời mời");
    }
    if (canvas.faces.inside.elements.filter((el) => el.type === "qr_code").length > 1) {
      fail(["faces", "inside"], "Mỗi thiệp chỉ có một mã QR");
    }
  });

const acceptButtonSchema = z
  .strictObject({
    enabled: z.boolean(),
    question: z.string().max(200),
    yesText: z.string().max(40),
    noText: z.string().max(40),
    dodgeNo: z.boolean(),
  })
  .refine((b) => !b.enabled || [b.question, b.yesText, b.noText].every((s) => s.trim() !== ""), {
    message: "Nhập đủ câu hỏi và chữ trên hai nút",
  });

const rsvpSchema = z
  .strictObject({
    enabled: z.boolean(),
    eventDate: z.string().max(40),
    locationName: z.string().max(200),
    mapsUrl: z.string().max(500),
  })
  .refine((b) => b.mapsUrl === "" || isHttpUrl(b.mapsUrl), {
    path: ["mapsUrl"],
    message: "Link bản đồ phải bắt đầu bằng http(s)://",
  })
  .refine(
    (b) => !b.enabled || (!Number.isNaN(Date.parse(b.eventDate)) && b.locationName.trim() !== ""),
    { message: "Nhập thời gian và địa điểm" },
  );

const pollSchema = z
  .strictObject({
    enabled: z.boolean(),
    question: z.string().max(200),
    options: z.array(z.string().max(120)).max(4),
  })
  .refine(
    (p) => {
      if (!p.enabled) return true;
      const options = p.options.map((o) => o.trim());
      return (
        p.question.trim() !== "" &&
        options.length >= 2 &&
        options.every(Boolean) &&
        new Set(options).size === options.length
      );
    },
    { message: "Bình chọn cần câu hỏi và 2-4 phương án khác nhau" },
  );

export const webConfigSchema = z.strictObject({
  recipientName: z.string().max(LIMITS.maxNameLength),
  senderName: z.string().max(LIMITS.maxNameLength),
  envelopeColor: hexColor,
  waxSealColor: hexColor,
  audio: z.strictObject({
    enabled: z.boolean(),
    trackId: z.string().regex(/^[a-z0-9-]{0,60}$/),
    startTime: z.number().min(0).max(600),
    volume: z.number().min(0).max(1),
  }),
  blocks: z.strictObject({
    acceptButton: acceptButtonSchema.optional(),
    rsvp: rsvpSchema.optional(),
    poll: pollSchema.optional(),
  }),
});

export const letterPayloadSchema = z.strictObject({
  template_type: z.enum(TEMPLATE_TYPES),
  title: z.string().max(120),
  canvas_data: canvasDataSchema,
  web_config: webConfigSchema,
}) satisfies z.ZodType<LetterPayload>;

export const letterPatchSchema = letterPayloadSchema
  .partial()
  .refine((patch) => Object.keys(patch).length > 0, { message: "Không có gì để cập nhật" });

const responderName = z.string().trim().max(100).optional();
const message = z.string().trim().max(1000).optional();

export const responseSchema = z.discriminatedUnion("action_type", [
  z.strictObject({
    action_type: z.literal("accept"),
    status: z.enum(["yes", "no"]),
    responder_name: responderName,
    message,
  }),
  z.strictObject({
    action_type: z.literal("rsvp"),
    status: z.enum(["attending", "not_attending"]),
    guest_count: z.number().int().min(1).max(20).default(1),
    responder_name: z.string().trim().min(1, "Nhập tên của bạn").max(100),
    message,
  }),
  z.strictObject({
    action_type: z.literal("poll"),
    poll_option: z.string().min(1).max(120),
    responder_name: responderName,
    message,
  }),
]);

export type ResponseInput = z.infer<typeof responseSchema>;
