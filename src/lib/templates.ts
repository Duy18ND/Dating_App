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

// 4 mẫu thiệp mini hai mặt. Nội dung và tọa độ do Gemini soạn (docs/gemini-output/T-28-mini-templates.md).
// Mỗi mặt là canvas 1760 x 1240, lề an toàn 84 px; chữ nhỏ nhất 48 px.
const { width: W, safeMarginPx: M } = PRINT_CONFIG.CANVAS;
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
  envelope: Partial<EnvelopeDecor>;
  envelopeColor: string;
  waxSealColor: string;
  web: Partial<WebConfig>;
}

export const TEMPLATES: Template[] = [
  {
    type: "confession",
    name: "Tỏ tình / Kỷ niệm",
    description: "Thiệp mini gập ngang: bìa tim nhỏ gọn, mặt trong mở nhạc và lời tỏ tình.",
    title: "Gửi cậu một điều nhỏ",
    front: {
      background: { type: "preset", value: "cream", overlayOpacity: 0 },
      elements: [
        icon("sparkle", 660, 176, 80, "#C8A882"),
        icon("heart", 800, 146, 160, "#8E2424"),
        icon("sparkle", 1020, 176, 80, "#C8A882"),
        text(380, "Gửi cậu\nmột điều nhỏ", 160, "Charm", "#8E2424", { x: 180, width: 1400 }),
        text(
          876,
          "Chỉ dành riêng cho người đang cầm tấm thiệp này",
          54,
          "Cormorant Garamond",
          "#5C524B",
          {
            x: 180,
            width: 1400,
          },
        ),
        icon("heart-line", 840, 996, 80, "#C8A882"),
      ],
    },
    inside: {
      background: { type: "preset", value: "cream", overlayOpacity: 0 },
      elements: [
        text(240, "Có một bản nhạc\nvà câu hỏi nhỏ", 104, "Charm", "#8E2424", {
          x: 120,
          width: 920,
        }),
        text(
          580,
          "Quét mã bên cạnh để mở phong bì online\nvà nghe điều mình chưa dám nói trực tiếp.",
          50,
          "Cormorant Garamond",
          "#5C524B",
          { x: 120, width: 920 },
        ),
        text(790, "Bật loa nhỏ thôi nha · Đọc xong bấm trả lời", 48, "Be Vietnam Pro", "#7A7067", {
          x: 84,
          width: 1000, // rộng hơn bản Gemini 80px để câu không tự xuống dòng
        }),
        icon("music-note", 520, 920, 100, "#C8A882"),
        qr(1190, 420, 400, "#8E2424", "heart"),
      ],
    },
    envelope: {
      monogram: "u ♡",
      line: "Mở nhẹ thôi nha, có điều nhỏ muốn nói.",
    },
    envelopeColor: "#DFC7A9",
    waxSealColor: "#8E2424",
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
    description: "Thiệp cưới mini tông kem – đỏ rượu vang, bìa tên đôi uyên ương, trong có QR.",
    title: "Thiệp mời thành hôn",
    front: {
      background: { type: "color", value: "#FBF6EE", overlayOpacity: 0 },
      elements: [
        icon("rings", 805, 130, 150, "#6E1F2A"),
        text(320, "TRÂN TRỌNG KÍNH MỜI", 56, "Cormorant Garamond", "#6E1F2A", {
          x: 180,
          width: 1400,
        }),
        icon("branch", 110, 520, 180, "#A8894F"),
        text(440, "Tên cô dâu\n&\nTên chú rể", 136, "Playfair Display", "#6E1F2A", {
          x: 330,
          width: 1100,
        }),
        icon("leaf", 1470, 530, 170, "#A8894F"),
        icon("wreath", 830, 1020, 100, "#A8894F"),
      ],
    },
    inside: {
      background: { type: "color", value: "#FBF6EE", overlayOpacity: 0 },
      elements: [
        text(210, "Tiệc thành hôn", 112, "Playfair Display", "#6E1F2A", { x: 120, width: 920 }),
        text(
          416,
          "17:30 · Chủ nhật, 10.01.2027\nTrung tâm Tiệc cưới (Tên địa điểm)\nSố nhà, Đường, Quận, TP (ví dụ)",
          52,
          "Cormorant Garamond",
          "#2B2623",
          { x: 120, width: 920 },
        ),
        text(
          700,
          "Quét mã để xác nhận tham dự\nvà xem bản đồ chỉ đường",
          48,
          "Be Vietnam Pro",
          "#7A7067",
          {
            x: 120,
            width: 920,
          },
        ),
        icon("branch", 510, 900, 140, "#A8894F"),
        qr(1190, 420, 400, "#6E1F2A", "rings"),
      ],
    },
    envelope: {
      monogram: "A & B",
      line: "Trân trọng kính mời đến chung vui cùng chúng mình.",
    },
    envelopeColor: "#F4E9DA",
    waxSealColor: "#6E1F2A",
    web: {
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
    description: "Vé mời đi ăn mini kèm 1 sticker meme, mặt trong hẹn lịch và bình chọn món.",
    title: "Vé mời đi ăn",
    front: {
      background: { type: "preset", value: "kraft", overlayOpacity: 0 },
      elements: [
        text(140, "★ VÉ HẸN VIP · ĐÃ THANH TOÁN TẤM LÒNG ★", 48, "Be Vietnam Pro", "#8E2424", {
          x: 120,
          width: 1520,
        }),
        text(320, "VÉ MỜI\nĐI ĂN", 160, "Mali", "#2B2623", { x: 120, width: 960 }),
        text(
          810,
          "Có giá trị cho 01 buổi no nê\nvà nói xấu cả thế giới",
          52,
          "Be Vietnam Pro",
          "#4E433C",
          {
            x: 120,
            width: 960,
          },
        ),
        icon("toast", 530, 996, 120, "#8E2424"),
        sticker("di-an-hong", 1180, 400, 380, 6),
        icon("star", 1220, 840, 80, "#C9A227"),
        icon("star", 1440, 840, 80, "#C9A227"),
      ],
    },
    inside: {
      background: { type: "preset", value: "cream", overlayOpacity: 0 },
      elements: [
        text(200, "Chốt lịch nha!", 120, "Mali", "#8E2424", { x: 120, width: 920 }),
        text(
          426,
          "Thời gian: 19:00 · Thứ Bảy (ví dụ)\nĐịa điểm: [Tên quán quen]",
          52,
          "Mali",
          "#2B2623",
          {
            x: 120,
            width: 920,
          },
        ),
        text(
          660,
          "Quét mã để vote món ăn\nvà xác nhận kèo tối nay!",
          50,
          "Be Vietnam Pro",
          "#5C524B",
          {
            x: 120,
            width: 920,
          },
        ),
        icon("squiggle", 440, 890, 140, "#8E2424"),
        qr(1190, 420, 400, "#2B2623", "toast"),
      ],
    },
    envelope: {
      monogram: "VIP ✦",
      line: "Vé chính chủ — không đổi trả, không bùng kèo!",
    },
    envelopeColor: "#C9A97E",
    waxSealColor: "#8E2424",
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
    description: "Thiệp chúc mini kẹp hộp quà: bìa sticker vui mắt, mặt trong quét QR mở quà.",
    title: "Chúc ngày thật vui",
    front: {
      background: { type: "preset", value: "plaid", overlayOpacity: 0 },
      elements: [
        icon("sparkle", 140, 150, 90, "#C9A227"),
        icon("sparkle", 1530, 150, 90, "#C9A227"),
        text(300, "Chúc cậu\nmột ngày\nthật rực rỡ!", 136, "Dancing Script", "#8E2424", {
          x: 120,
          width: 940,
        }),
        text(910, "GỬI KÈM NHIỀU NIỀM VUI NHỎ", 48, "Be Vietnam Pro", "#2F4A3A", {
          x: 120,
          width: 940,
        }),
        sticker("chuc-mung", 1160, 410, 380, -4),
        icon("star", 1310, 860, 90, "#C9A227"),
      ],
    },
    inside: {
      background: { type: "preset", value: "cream", overlayOpacity: 0 },
      elements: [
        text(240, "Mở món quà nhỏ\nở bên cạnh nhé", 112, "Charm", "#2F4A3A", {
          x: 120,
          width: 920,
        }),
        text(
          610,
          "Quét mã QR để nghe nhạc\nvà xem lại mấy khoảnh khắc đáng nhớ.",
          50,
          "Cormorant Garamond",
          "#5C524B",
          { x: 120, width: 920 },
        ),
        text(820, "Giữ tấm thiệp mini này kẹp sổ tay nha", 48, "Be Vietnam Pro", "#7A7067", {
          x: 120,
          width: 920,
        }),
        icon("crown", 520, 950, 110, "#C9A227"),
        qr(1190, 420, 400, "#2F4A3A", "star"),
      ],
    },
    envelope: {
      monogram: "HPBD ★",
      line: "Kẹp kèm thật nhiều niềm vui nhỏ gửi cậu.",
    },
    envelopeColor: "#E8DEC8",
    waxSealColor: "#2F4A3A",
    web: {
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
    web_config: {
      ...base.web_config,
      ...template.web,
      envelopeColor: template.envelopeColor,
      waxSealColor: template.waxSealColor,
    },
  });
}
