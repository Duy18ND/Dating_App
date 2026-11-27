import { blankLetter } from "@/lib/editor/defaults";
import type { FontName } from "@/lib/font-names";
import { PRINT_CONFIG } from "@/lib/print-config";
import { STICKER_SIZE_PX } from "@/lib/stickers";
import type { CanvasElement, LetterPayload, TemplateType, WebConfig } from "@/types/letter";

// 4 mẫu bố cục cho thiệp A6. Tọa độ theo canvas logic 1240 x 1754, lề an toàn 94px.
const { width: W, safeMarginPx: M, minQrPx, defaultQrPx } = PRINT_CONFIG.CANVAS;
const CONTENT_W = W - M * 2;

type Draft = Omit<CanvasElement, "id" | "zIndex" | "rotation"> & { rotation?: number };

const text = (
  y: number,
  content: string,
  fontSize: number,
  fontFamily: FontName,
  fill = "#2B2623",
  box: { x: number; width: number } = { x: M, width: CONTENT_W },
): Draft => ({ type: "text", y, text: content, fontSize, fontFamily, fill, align: "center", ...box });

const icon = (iconId: string, x: number, y: number, size: number, fill: string): Draft => ({
  type: "svg_icon",
  iconId,
  x,
  y,
  width: size,
  height: size,
  fill,
});

const sticker = (id: string, x: number, y: number, size: number, rotation = 0): Draft => ({
  type: "sticker_img",
  src: `/stickers/memes/${id}.webp`,
  x,
  y,
  width: Math.min(size, STICKER_SIZE_PX),
  height: Math.min(size, STICKER_SIZE_PX),
  rotation,
});

const qr = (x: number, y: number, size: number, fill: string, iconId?: string): Draft => ({
  type: "qr_code",
  x,
  y,
  width: size,
  height: size,
  fill,
  iconId,
});

interface Template {
  type: TemplateType;
  name: string;
  description: string;
  title: string;
  background: LetterPayload["canvas_data"]["background"];
  elements: Draft[];
  web: Partial<WebConfig>;
}

const WINE = "#6E1F2A";

export const TEMPLATES: Template[] = [
  {
    type: "confession",
    name: "Tỏ tình / Kỷ niệm",
    description: "Tiêu đề hoặc ảnh Polaroid, 8 dòng kẻ để viết tay và mã QR mở thư.",
    title: "Gửi người thương",
    background: { type: "preset", value: "cream", overlayOpacity: 0 },
    // Bố cục 35 / 45 / 20: tiêu đề, vùng viết tay, QR kèm lời nhắn.
    elements: [
      icon("heart", 560, 150, 120, "#8E2424"),
      text(310, "Gửi người thương", 112, "Charm", "#8E2424"),
      text(490, "Có điều này mình muốn nói với bạn...", 52, "Cormorant Garamond"),
      { type: "lined_area", x: M, y: 600, width: CONTENT_W, height: 660, lineStyle: "ruled" },
      qr(130, 1372, defaultQrPx - 20, "#8E2424", "heart"),
      text(1430, "Quét mã để nghe\nđiều mình chưa dám nói", 52, "Dancing Script", "#2B2623", {
        x: 450,
        width: 696,
      }),
    ],
    web: {
      audio: { enabled: false, trackId: "romantic-1", startTime: 0, volume: 0.4 },
      blocks: {
        acceptButton: {
          enabled: true,
          question: "Làm người yêu mình nhé?",
          yesText: "Đồng ý",
          noText: "Để suy nghĩ",
          dodgeNo: true,
        },
      },
    },
  },
  {
    type: "wedding",
    name: "Mời cưới / Đính hôn",
    description: "Tông kem và rượu vang trang trọng, có form xác nhận tham dự.",
    title: "Thiệp mời cưới",
    background: { type: "color", value: "#FBF6EE", overlayOpacity: 0 },
    elements: [
      icon("rings", 540, 130, 160, WINE),
      text(340, "TRÂN TRỌNG KÍNH MỜI", 50, "Cormorant Garamond", WINE),
      text(480, "Minh Anh\n&\nHoàng Nam", 110, "Playfair Display", WINE),
      icon("branch", 130, 520, 200, "#A8894F"),
      icon("leaf", 920, 700, 170, "#A8894F"),
      text(990, "Tới dự tiệc thành hôn của chúng mình\n17:30, Chủ nhật 10.01.2027\nNhà hàng Hoa Sen", 50, "Cormorant Garamond"),
      qr(480, 1340, defaultQrPx, WINE, "rings"),
      text(1250, "Quét mã để xác nhận tham dự", 36, "Be Vietnam Pro", "#7A7067"),
    ],
    web: {
      envelopeColor: "#F4E9DA",
      waxSealColor: WINE,
      audio: { enabled: false, trackId: "wedding-1", startTime: 0, volume: 0.4 },
      blocks: {
        rsvp: { enabled: true, eventDate: "2027-01-10T17:30", locationName: "Nhà hàng Hoa Sen", mapsUrl: "" },
      },
    },
  },
  {
    type: "dinner",
    name: "Mời ăn / Hẹn hò",
    description: "Vé mời vui nhộn kèm sticker và bình chọn món ăn.",
    title: "Vé mời đi ăn",
    background: { type: "preset", value: "kraft", overlayOpacity: 0 },
    elements: [
      text(150, "VÉ MỜI ĐI ĂN", 124, "Mali"),
      text(340, "Có giá trị cho 01 buổi no nê", 50, "Be Vietnam Pro"),
      icon("squiggle", 470, 420, 300, "#8E2424"),
      sticker("di-an-hong", 130, 710, 380, -6),
      sticker("chot-keo", 730, 770, 380, 6),
      text(1190, "Thời gian: ................\nĐịa điểm: ..................", 52, "Mali"),
      qr(480, 1360, defaultQrPx - 20, "#2B2623", "toast"),
    ],
    web: {
      audio: { enabled: false, trackId: "fun-1", startTime: 0, volume: 0.4 },
      blocks: {
        poll: { enabled: true, question: "Mình ăn gì đây?", options: ["Lẩu", "Đồ nướng", "Bún đậu"] },
        acceptButton: {
          enabled: true,
          question: "Đi hông?",
          yesText: "Chốt kèo",
          noText: "Bận rồi",
          dodgeNo: true,
        },
      },
    },
  },
  {
    type: "holiday",
    name: "Sinh nhật / Giáng sinh",
    description: "Bưu thiếp có vùng chấm bi để viết lời chúc, kẹp kèm hộp quà.",
    title: "Lời chúc ngày vui",
    background: { type: "preset", value: "plaid", overlayOpacity: 0 },
    elements: [
      text(160, "Chúc mừng ngày vui!", 108, "Dancing Script", "#8E2424"),
      icon("sparkle", 130, 360, 130, "#C9A227"),
      icon("sparkle", 980, 360, 130, "#C9A227"),
      sticker("chuc-mung", 430, 350, 380),
      { type: "lined_area", x: M, y: 780, width: CONTENT_W, height: 500, lineStyle: "dot_grid" },
      qr(866, 1380, minQrPx, "#2F4A3A", "star"),
      text(1440, "Mở quà online\nở mã bên cạnh nhé", 56, "Charm", "#2B2623", { x: M, width: 720 }),
    ],
    web: {
      waxSealColor: "#2F4A3A",
      audio: { enabled: false, trackId: "festive-1", startTime: 0, volume: 0.4 },
    },
  },
];

export const findTemplate = (type: string | null | undefined) =>
  TEMPLATES.find((template) => template.type === type);

/** Trả về bản sao độc lập, sửa trong editor không làm đổi mẫu gốc. */
export function createFromTemplate(type: TemplateType): LetterPayload {
  const template = findTemplate(type)!;
  const base = blankLetter(type);
  return structuredClone({
    ...base,
    title: template.title,
    canvas_data: {
      ...base.canvas_data,
      background: template.background,
      elements: template.elements.map((element, zIndex) => ({
        rotation: 0,
        ...element,
        id: `${type}-${zIndex}`,
        zIndex,
      })),
    },
    web_config: { ...base.web_config, ...template.web },
  });
}
