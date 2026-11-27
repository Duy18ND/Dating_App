import { blankLetter } from "@/lib/editor/defaults";
import type { FontName } from "@/lib/font-names";
import { PRINT_CONFIG } from "@/lib/print-config";
import { STICKER_SIZE_PX } from "@/lib/stickers";
import type { CanvasElement, LetterPayload, TemplateType, WebConfig } from "@/types/letter";

// 4 mẫu bố cục cho thiệp A6. Tọa độ theo canvas logic 1240 x 1754, lề an toàn 94px.
const { width: W, safeMarginPx: M, defaultQrPx } = PRINT_CONFIG.CANVAS;
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
    description: "Bố cục 35/45/20: tiêu đề gọn, 7 dòng kẻ viết tay và mã QR mở nhạc.",
    title: "Gửi cậu một điều nhỏ",
    background: { type: "preset", value: "cream", overlayOpacity: 0 },
    // Bố cục 35 / 45 / 20: tiêu đề ấm áp (hoặc thay bằng ảnh Polaroid), 7 dòng viết tay, QR mở nhạc.
    elements: [
      icon("wax-seal", 564, 114, 112, "#8E2424"),
      icon("sparkle", 460, 146, 48, "#C8A882"),
      icon("sparkle", 732, 146, 48, "#C8A882"),
      text(262, "Gửi cậu một điều nhỏ", 108, "Charm", "#8E2424"),
      text(
        432,
        "Dành cho những lúc muốn nói trực tiếp\nmà tim lại đập hơi nhanh một chút.",
        48,
        "Cormorant Garamond",
        "#5C524B",
      ),
      icon("heart-line", 588, 578, 64, "#8E2424"),
      { type: "lined_area", x: M, y: 664, width: CONTENT_W, height: 580, lineStyle: "ruled" },
      qr(134, 1344, 260, "#8E2424", "heart"),
      text(
        1366,
        "Quét mã để nghe bản nhạc\nvà xem điều mình muốn hỏi nhé",
        52,
        "Dancing Script",
        "#2B2623",
        { x: 452, width: 694 },
      ),
      text(1536, "Mở bằng camera điện thoại · Bật loa nhỏ thôi nha", 30, "Be Vietnam Pro", "#7A7067", {
        x: 452,
        width: 694,
      }),
    ],
    web: {
      audio: { enabled: false, trackId: "romantic-1", startTime: 0, volume: 0.4 },
      blocks: {
        acceptButton: {
          enabled: true,
          question: "Mình chính thức hẹn hò nha?",
          yesText: "Đồng ý luôn",
          noText: "Cho suy nghĩ thêm xíu",
          dodgeNo: true,
        },
      },
    },
  },
  {
    type: "wedding",
    name: "Mời cưới / Đính hôn",
    description: "Tông kem và đỏ rượu vang trang trọng, kèm mã QR xác nhận tham dự.",
    title: "Thiệp mời thành hôn",
    background: { type: "color", value: "#FBF6EE", overlayOpacity: 0 },
    elements: [
      icon("rings", 554, 114, 132, WINE),
      text(274, "TRÂN TRỌNG KÍNH MỜI", 44, "Cormorant Garamond", WINE),
      text(358, "Tới chung vui trong ngày trọng đại của", 42, "Cormorant Garamond", "#5C524B"),
      icon("branch", 104, 514, 148, "#A8894F"),
      icon("leaf", 988, 520, 136, "#A8894F"),
      text(446, "Tên cô dâu\n&\nTên chú rể", 96, "Playfair Display", WINE, { x: 268, width: 704 }),
      icon("wreath", 576, 858, 88, "#A8894F"),
      text(
        974,
        "17:30 · Chủ nhật, 10.01.2027\nTrung tâm Tiệc cưới (Tên địa điểm)\nSố nhà, Đường, Quận, Thành phố",
        46,
        "Cormorant Garamond",
        "#2B2623",
      ),
      text(1204, "Quét mã để xác nhận tham dự & xem bản đồ", 34, "Be Vietnam Pro", "#7A7067"),
      qr(480, 1320, defaultQrPx, WINE, "rings"),
    ],
    web: {
      envelopeColor: "#F4E9DA",
      waxSealColor: WINE,
      audio: { enabled: false, trackId: "wedding-1", startTime: 0, volume: 0.4 },
      blocks: {
        rsvp: {
          enabled: true,
          eventDate: "2027-01-10T17:30",
          locationName: "Trung tâm Tiệc cưới (Tên địa điểm)",
          mapsUrl: "",
        },
      },
    },
  },
  {
    type: "dinner",
    name: "Mời ăn / Hẹn hò",
    description: "Vé hẹn ăn uống vui nhộn, có sẵn 2 sticker meme và bình chọn món.",
    title: "Vé mời đi ăn",
    background: { type: "preset", value: "kraft", overlayOpacity: 0 },
    elements: [
      text(114, "★ VÉ HẸN VIP · ĐÃ THANH TOÁN NỬA TẤM LÒNG ★", 30, "Be Vietnam Pro", "#8E2424"),
      text(176, "VÉ MỜI ĐI ĂN", 116, "Mali", "#2B2623"),
      text(350, "Có giá trị cho 01 buổi ăn no nê & nói xấu cả thế giới", 42, "Be Vietnam Pro", "#4E433C"),
      icon("star", 476, 450, 48, "#C9A227"),
      icon("toast", 574, 428, 92, "#8E2424"),
      icon("star", 716, 450, 48, "#C9A227"),
      sticker("di-an-hong", 124, 550, 380, -6),
      sticker("chot-keo", 736, 570, 380, 6),
      text(
        994,
        "Ngày giờ: ........................................\nĐiểm hẹn: .......................................\nQuy định: Không bùng kèo giờ chót",
        44,
        "Mali",
        "#2B2623",
      ),
      qr(134, 1340, 260, "#2B2623", "toast"),
      text(1366, "Quét mã chốt kèo\nvà vote món ăn tối nay!", 54, "Mali", "#8E2424", {
        x: 452,
        width: 694,
      }),
      text(1538, "Trình vé này cho người mời để đổi trà sữa", 30, "Be Vietnam Pro", "#5C524B", {
        x: 452,
        width: 694,
      }),
    ],
    web: {
      audio: { enabled: false, trackId: "fun-1", startTime: 0, volume: 0.4 },
      blocks: {
        poll: {
          enabled: true,
          question: "Tối nay tụi mình ăn gì cho đã?",
          options: ["Lẩu cay", "Thịt nướng", "Bún đậu mắm tôm"],
        },
        acceptButton: {
          enabled: true,
          question: "Chốt lịch hẹn này luôn nha?",
          yesText: "Chốt đơn liền",
          noText: "Hôm khác đi mà",
          dodgeNo: true,
        },
      },
    },
  },
  {
    type: "holiday",
    name: "Sinh nhật / Giáng sinh",
    description: "Bưu thiếp có vùng chấm bi viết lời chúc, 1 sticker và mã QR mở quà.",
    title: "Chúc ngày thật vui",
    background: { type: "preset", value: "plaid", overlayOpacity: 0 },
    elements: [
      text(118, "Chúc cậu một ngày thật rực rỡ!", 94, "Dancing Script", "#8E2424"),
      text(258, "BƯU THIẾP GỬI KÈM NHIỀU NIỀM VUI NHỎ", 32, "Be Vietnam Pro", "#2F4A3A"),
      icon("sparkle", 168, 434, 112, "#C9A227"),
      sticker("chuc-mung", 440, 326, 360),
      icon("sparkle", 960, 434, 112, "#C9A227"),
      { type: "lined_area", x: M, y: 722, width: CONTENT_W, height: 552, lineStyle: "dot_grid" },
      text(1372, "Quét mã bên cạnh\nđể nghe nhạc & mở lời nhắn nha", 54, "Charm", "#2B2623", {
        x: M,
        width: 700,
      }),
      text(1542, "Gợi ý: giữ lại tấm bưu thiếp này kẹp vào sổ tay nhé", 28, "Be Vietnam Pro", "#5C524B", {
        x: M,
        width: 700,
      }),
      qr(852, 1344, 260, "#2F4A3A", "star"),
    ],
    web: {
      waxSealColor: "#2F4A3A",
      audio: { enabled: false, trackId: "festive-1", startTime: 0, volume: 0.4 },
      blocks: {
        acceptButton: {
          enabled: true,
          question: "Nhận hết lời chúc và niềm vui này nha?",
          yesText: "Nhận luôn nè!",
          noText: "Xin thêm chút may mắn",
          dodgeNo: false,
        },
      },
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
