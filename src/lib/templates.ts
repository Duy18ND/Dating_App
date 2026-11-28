import { blankLetter } from "@/lib/editor/defaults";
import type { FontName } from "@/lib/font-names";
import { PRINT_CONFIG } from "@/lib/print-config";
import { STICKER_SIZE_PX } from "@/lib/stickers";
import { defaultWebSections } from "@/lib/web-defaults";
import { defaultWebStyle } from "@/lib/web-styles";
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

const DEFAULT_TEXT_BOX: { x: number; width: number; align?: "left" | "center" | "right" } = {
  x: M,
  width: CONTENT_W,
};

const text = (
  y: number,
  content: string,
  fontSize: number,
  fontFamily: FontName,
  fill = "#2B2623",
  box: { x: number; width: number; align?: "left" | "center" | "right" } = DEFAULT_TEXT_BOX,
): Draft => ({
  type: "text",
  y,
  text: content,
  fontSize,
  fontFamily,
  fill,
  align: box.align ?? "center",
  x: box.x,
  width: box.width,
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

const linedArea = (
  x: number,
  y: number,
  width: number,
  height: number,
  fill = "#7A7067",
): Draft => ({
  type: "lined_area",
  lineStyle: "ruled",
  x,
  y,
  width,
  height,
  fill,
});

/** Khối ký tên đồng nhất ở góc dưới phải cho mặt sau của cả 4 mẫu (font chữ ký Dancing Script). */
const signatureBlock = (primaryFill: string, mutedFill = "#7A7067"): Draft[] => [
  text(970, "Ký tên,", 52, "Dancing Script", mutedFill, {
    x: 1020,
    width: 620,
    align: "right",
  }),
  text(1042, "— Tên của bạn", 66, "Dancing Script", primaryFill, {
    x: 1020,
    width: 620,
    align: "right",
  }),
];

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
    description: "Bìa tim nhỏ gọn, trang lời mời có mã QR mở nhạc và lời tỏ tình.",
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
        text(124, "Gửi cậu,", 76, "Charm", "#8E2424", { x: 120, width: 1160, align: "left" }),
        text(
          244,
          "Có một bản nhạc và vài điều nhỏ\nmình muốn gửi riêng cho cậu.",
          52,
          "Cormorant Garamond",
          "#5C524B",
          { x: 120, width: 1160, align: "left" },
        ),
        qr(1360, 120, 280, "#8E2424", "heart"),
        linedArea(120, 452, 1520, 480, "#7A7067"),
        ...signatureBlock("#8E2424", "#7A7067"),
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
        reply: {
          enabled: true,
          prompt: "Cậu đọc xong rồi nhắn lại mình vài dòng nhé 💌",
          placeholder: "Viết vài dòng trả lời hoặc cảm nhận của cậu...",
          quickReactions: ["Đã nhận thư ❤️", "Cảm động quá 🥺", "Đồng ý liền 🎉", "Hẹn gặp nhé ☕"],
        },
      },
    },
  },
  {
    type: "wedding",
    name: "Mời cưới / Đính hôn",
    description: "Thiệp cưới mini tông kem – đỏ rượu vang, bìa tên đôi uyên ương, lời mời kèm mã QR.",
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
        text(124, "Tiệc thành hôn", 76, "Playfair Display", "#6E1F2A", {
          x: 120,
          width: 1160,
          align: "left",
        }),
        text(
          244,
          "17:30 · Chủ nhật, 10.01.2027\nTrung tâm Tiệc cưới (Tên địa điểm)",
          50,
          "Cormorant Garamond",
          "#2B2623",
          { x: 120, width: 1160, align: "left" },
        ),
        qr(1360, 120, 280, "#6E1F2A", "rings"),
        linedArea(120, 452, 1520, 480, "#8B7D72"),
        ...signatureBlock("#6E1F2A", "#7A7067"),
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
        reply: {
          enabled: true,
          prompt: "Gửi lời chúc phúc đến cô dâu & chú rể 💐",
          placeholder: "Nhắn vài lời chúc thật đẹp nhé...",
          quickReactions: ["Chúc trăm năm hạnh phúc 💍", "Nhất định sẽ tới 🥂", "Đã nhận thiệp 💌"],
        },
      },
    },
  },
  {
    type: "dinner",
    name: "Mời ăn / Hẹn hò",
    description: "Vé mời đi ăn mini kèm 1 sticker meme, trang lời mời hẹn lịch và mã QR bình chọn món.",
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
        text(124, "Chốt lịch nha!", 76, "Mali", "#8E2424", {
          x: 120,
          width: 1160,
          align: "left",
        }),
        text(
          244,
          "Thời gian: 19:00 · Thứ Bảy\nĐịa điểm: [Tên quán quen]",
          50,
          "Mali",
          "#2B2623",
          { x: 120, width: 1160, align: "left" },
        ),
        qr(1360, 120, 280, "#2B2623", "toast"),
        linedArea(120, 452, 1520, 480, "#7A7067"),
        ...signatureBlock("#8E2424", "#7A7067"),
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
        reply: {
          enabled: true,
          prompt: "Chốt giờ hẹn hoặc nhắn thêm món muốn ăn 🍜",
          placeholder: "VD: 19h qua đón mình nha, thèm lẩu quá...",
          quickReactions: ["Đã nhận vé VIP 🎫", "Chốt kèo đi ăn 🔥", "Bao no luôn 😋"],
        },
      },
    },
  },
  {
    type: "holiday",
    name: "Sinh nhật / Giáng sinh",
    description: "Thiệp chúc mini kẹp hộp quà: bìa sticker vui mắt, quét mã QR để mở quà.",
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
        text(124, "Chúc cậu thật vui,", 76, "Charm", "#2F4A3A", {
          x: 120,
          width: 1160,
          align: "left",
        }),
        text(
          244,
          "Chúc cậu một ngày rực rỡ\nvà thật nhiều niềm vui nhỏ.",
          52,
          "Cormorant Garamond",
          "#5C524B",
          { x: 120, width: 1160, align: "left" },
        ),
        qr(1360, 120, 280, "#2F4A3A", "star"),
        linedArea(120, 452, 1520, 480, "#7A7067"),
        ...signatureBlock("#2F4A3A", "#7A7067"),
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
        reply: {
          enabled: true,
          prompt: "Nhắn lại vài dòng cảm ơn hoặc ước điều gì đó ✨",
          placeholder: "Gửi lại vài dòng cho người tặng thiệp...",
          quickReactions: ["Đã nhận quà & lời chúc 🎁", "Cảm ơn cậu nhiều ❤️", "Vui quá đi 🥳"],
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
      style: defaultWebStyle(type),
      sections: defaultWebSections(type),
    },
  });
}
