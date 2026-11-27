import { blankLetter } from "@/lib/editor/defaults";
import type { FontName } from "@/lib/font-names";
import { PRINT_CONFIG } from "@/lib/print-config";
import { STICKER_SIZE_PX } from "@/lib/stickers";
import type {
  BackgroundConfig,
  CanvasElement,
  EnvelopeDecor,
  FaceId,
  LetterPayload,
  TemplateType,
  WebConfig,
} from "@/types/letter";

// 4 mẫu thiệp mini (bố cục tạm, T-28 thay bằng bản của Gemini). Mỗi mặt là canvas 1760 x 1240,
// lề an toàn 84 px; chữ nhỏ nhất 48 px.
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
): Draft => ({
  type: "text",
  y,
  text: content,
  fontSize,
  fontFamily,
  fill,
  align: "center",
  ...box,
});

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

interface FaceDraft {
  background: BackgroundConfig;
  elements: Draft[];
}

interface Template {
  type: TemplateType;
  name: string;
  description: string;
  title: string;
  front: FaceDraft;
  inside: FaceDraft;
  envelope?: Partial<EnvelopeDecor>;
  web: Partial<WebConfig>;
}

const WINE = "#6E1F2A";
const preset = (value: string): BackgroundConfig => ({ type: "preset", value, overlayOpacity: 0 });
const color = (value: string): BackgroundConfig => ({ type: "color", value, overlayOpacity: 0 });
/** Cột chữ bên trái trang Lời mời, chừa bên phải cho mã QR. */
const LEFT = { x: 120, width: 900 };
const QR_X = 1180;
const QR_Y = 400;

export const TEMPLATES: Template[] = [
  {
    type: "confession",
    name: "Tỏ tình / Kỷ niệm",
    description: "Bìa tiêu đề nhỏ xinh, bên trong một lời mời và mã QR mở nhạc.",
    title: "Gửi cậu một điều nhỏ",
    front: {
      background: preset("cream"),
      elements: [
        icon("wax-seal", 820, 200, 120, "#8E2424"),
        text(380, "Gửi cậu một điều nhỏ", 150, "Charm", "#8E2424"),
        text(660, "Mở ra từ từ thôi nhé...", 64, "Cormorant Garamond", "#5C524B"),
        icon("heart-line", 840, 830, 80, "#8E2424"),
      ],
    },
    inside: {
      background: preset("cream"),
      elements: [
        text(
          380,
          "Quét mã để nghe bản nhạc\nvà điều mình muốn hỏi",
          72,
          "Dancing Script",
          "#2B2623",
          LEFT,
        ),
        text(
          640,
          "Mở bằng camera điện thoại\nnhớ bật loa nhỏ thôi nha",
          48,
          "Be Vietnam Pro",
          "#7A7067",
          LEFT,
        ),
        qr(QR_X, QR_Y, defaultQrPx, "#8E2424", "heart"),
      ],
    },
    envelope: { monogram: "u ♡", line: "Một điều nhỏ dành cho cậu" },
    web: {
      envelopeColor: "#F2D7D5",
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
    front: {
      background: color("#FBF6EE"),
      elements: [
        icon("rings", 820, 110, 120, WINE),
        text(270, "TRÂN TRỌNG KÍNH MỜI", 56, "Cormorant Garamond", WINE),
        text(390, "Tên cô dâu & Tên chú rể", 120, "Playfair Display", WINE),
        icon("branch", 200, 620, 140, "#A8894F"),
        text(640, "Ngày chung đôi", 60, "Dancing Script", "#5C524B", { x: 380, width: 1000 }),
        icon("leaf", 1420, 620, 140, "#A8894F"),
      ],
    },
    inside: {
      background: color("#FBF6EE"),
      elements: [
        text(220, "17:30 · Chủ nhật\n10.01.2027", 64, "Cormorant Garamond", WINE, LEFT),
        text(460, "Trung tâm Tiệc cưới\n(Tên địa điểm)", 56, "Cormorant Garamond", "#2B2623", LEFT),
        text(
          700,
          "Quét mã để xác nhận\ntham dự và xem bản đồ",
          48,
          "Be Vietnam Pro",
          "#7A7067",
          LEFT,
        ),
        qr(QR_X, QR_Y, defaultQrPx, WINE, "rings"),
      ],
    },
    envelope: { monogram: "C & R", line: "Trân trọng kính mời" },
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
    description: "Vé hẹn ăn uống vui nhộn, có sẵn 2 sticker và bình chọn món.",
    title: "Vé mời đi ăn",
    front: {
      background: preset("kraft"),
      elements: [
        text(150, "VÉ MỜI ĐI ĂN", 150, "Mali", "#2B2623"),
        text(380, "Có giá trị cho 01 buổi no nê", 56, "Be Vietnam Pro", "#4E433C"),
        sticker("di-an-hong", 440, 520, 360, -6),
        sticker("chot-keo", 960, 520, 360, 6),
      ],
    },
    inside: {
      background: preset("kraft"),
      elements: [
        text(
          220,
          "Ngày giờ: ............\nĐiểm hẹn: ...........\nKhông bùng kèo giờ chót",
          56,
          "Mali",
          "#2B2623",
          LEFT,
        ),
        text(560, "Quét mã để chốt kèo\nvà vote món ăn nha!", 64, "Mali", "#8E2424", LEFT),
        qr(QR_X, QR_Y, defaultQrPx, "#2B2623", "toast"),
      ],
    },
    envelope: { monogram: "VIP", line: "Vé mời đặc biệt" },
    web: {
      envelopeColor: "#C8A882",
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
    description: "Bưu thiếp mini có sticker, bên trong mã QR mở quà online.",
    title: "Chúc ngày thật vui",
    front: {
      background: preset("plaid"),
      elements: [
        text(150, "Chúc cậu một ngày\nthật rực rỡ!", 120, "Dancing Script", "#8E2424"),
        icon("sparkle", 480, 640, 110, "#C9A227"),
        sticker("chuc-mung", 700, 540, 360),
        icon("sparkle", 1170, 640, 110, "#C9A227"),
      ],
    },
    inside: {
      background: preset("cream"),
      elements: [
        text(300, "Quét mã bên cạnh\nđể mở quà online nha", 72, "Charm", "#2B2623", LEFT),
        text(560, "Giữ tấm thiệp này\nkẹp vào sổ tay nhé", 48, "Be Vietnam Pro", "#5C524B", LEFT),
        qr(QR_X, QR_Y, defaultQrPx, "#2F4A3A", "star"),
      ],
    },
    envelope: { monogram: "HPBD", line: "Một chút niềm vui gửi cậu" },
    web: {
      envelopeColor: "#DDEBD8",
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

const toElements = (face: FaceId, type: TemplateType, drafts: Draft[]): CanvasElement[] =>
  drafts.map((element, zIndex) => ({
    rotation: 0,
    ...element,
    id: `${type}-${face}-${zIndex}`,
    zIndex,
  }));

/** Trả về bản sao độc lập, sửa trong editor không làm đổi mẫu gốc. */
export function createFromTemplate(type: TemplateType): LetterPayload {
  const template = findTemplate(type)!;
  const base = blankLetter(type);
  return structuredClone({
    ...base,
    title: template.title,
    canvas_data: {
      ...base.canvas_data,
      faces: {
        front: {
          background: template.front.background,
          elements: toElements("front", type, template.front.elements),
        },
        inside: {
          background: template.inside.background,
          elements: toElements("inside", type, template.inside.elements),
        },
      },
      envelope: { ...base.canvas_data.envelope, ...template.envelope },
    },
    web_config: { ...base.web_config, ...template.web },
  });
}
