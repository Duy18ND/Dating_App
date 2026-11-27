import type { FontName } from "@/lib/font-names";

export const TEMPLATE_TYPES = ["confession", "wedding", "dinner", "holiday"] as const;
export type TemplateType = (typeof TEMPLATE_TYPES)[number];

export const BACKGROUND_PRESETS = ["kraft", "cream", "grid", "plaid"] as const;
export type BackgroundPreset = (typeof BACKGROUND_PRESETS)[number];

export interface BackgroundConfig {
  type: "preset" | "color" | "image";
  value: string; // preset | '#RRGGBB' | URL ảnh trên R2
  overlayColor?: string; // mặc định '#FFFFFF'
  overlayOpacity: number; // 0 -> 0.8 (mặc định 0.35 khi dùng ảnh nền)
  blur?: number; // 0 -> 10 (px logic)
}

export const ELEMENT_TYPES = [
  "text",
  "image",
  "svg_icon",
  "sticker_img",
  "handwriting",
  "lined_area",
  "qr_code",
] as const;
export type ElementType = (typeof ELEMENT_TYPES)[number];

export const IMAGE_FRAMES = ["none", "polaroid", "stamp", "rounded", "circle", "cloud"] as const;
export type ImageFrame = (typeof IMAGE_FRAMES)[number];

export const IMAGE_FILTERS = ["none", "vintage", "bw"] as const;
export type ImageFilter = (typeof IMAGE_FILTERS)[number];

/** Điểm giữ khi cắt ảnh theo khung (từ 0 đến 1, mặc định giữa 0.5, 0.5 — FR-16). */
export interface ImageFocus {
  x: number;
  y: number;
}

export const IMAGE_FITS = ["contain", "cover"] as const;
export type ImageFit = (typeof IMAGE_FITS)[number];

/** Ảnh dùng trong các phần trang web cuộn (FR-10, FR-16). */
export interface WebImage {
  src: string;
  fit?: ImageFit;
  focus?: ImageFocus;
  /** Bề rộng khung ảnh tính theo % chỗ dành cho nó (40..100, mặc định 100). */
  size?: number;
  /** Phóng to ảnh bên trong khung quanh điểm giữ (1..3, mặc định 1). */
  zoom?: number;
}

export interface CanvasElement {
  id: string;
  type: ElementType;
  // Góc trên trái theo hệ tọa độ logic của mặt thiệp (PRINT_CONFIG.CANVAS); rotation tính bằng độ quanh điểm này.
  x: number;
  y: number;
  width?: number;
  height?: number;
  rotation: number;
  zIndex: number;
  locked?: boolean;
  // Text
  text?: string;
  fontFamily?: FontName;
  fontSize?: number;
  fill?: string; // màu chữ, icon, nét vẽ hoặc màu QR
  align?: "left" | "center" | "right";
  // Ảnh & sticker
  src?: string;
  frame?: ImageFrame;
  filter?: ImageFilter;
  focus?: ImageFocus;
  /** Độ dày viền trắng quanh ảnh (0..48 px logic; 0 = tắt viền). */
  borderWidth?: number;
  // SVG icon
  iconId?: string;
  // Ghi tay (mỗi phần tử là một nét [x1, y1, x2, y2, ...] tương đối so với x, y) và vùng kẻ
  points?: number[];
  strokeWidth?: number;
  lineStyle?: "ruled" | "dot_grid";
}

/** Một mặt thiệp được thiết kế tự do trên canvas 1760 x 1240. */
export interface CardFace {
  background: BackgroundConfig;
  elements: CanvasElement[];
}

/** Thiệp phẳng in 2 mặt: front = mặt trước; inside = mặt sau, nơi đặt mã QR. */
export const FACE_IDS = ["front", "inside"] as const;
export type FaceId = (typeof FACE_IDS)[number];

export const PAPER_STYLES = ["ruled", "dot_grid", "plain"] as const;
export type PaperStyle = (typeof PAPER_STYLES)[number];

/** Trang bên trái khi mở thiệp: để người gửi viết bút. */
export interface WritingPageConfig {
  paper: PaperStyle;
  color: string;
}

/** Thư viết tay gấp 3 (FR-11). */
export interface LetterSheetConfig {
  paper: PaperStyle;
  greeting: string;
  signature: string;
  fontFamily: FontName;
  inkColor: string;
  paperColor: string;
  decorIconId?: string;
}

/** Chữ trên phong bì (FR-12). Màu giấy là web_config.envelopeColor. */
export interface EnvelopeDecor {
  monogram: string;
  line: string;
  /** Chữ ở mặt trước phong bì. Không có hoặc "Gửi": tự thêm tên người nhận; rỗng: để trơn. */
  frontText?: string;
  fontFamily: FontName;
}

export interface CanvasData {
  version: 2;
  width: 1760;
  height: 1240;
  faces: Record<FaceId, CardFace>;
  writingPage: WritingPageConfig;
  letter: LetterSheetConfig;
  envelope: EnvelopeDecor;
}

export const WEB_SECTION_TYPES = [
  "hero",
  "first_day",
  "memories",
  "reasons",
  "counter",
  "message",
  "interact",
  "ending",
  "board",
] as const;
export type WebSectionType = (typeof WEB_SECTION_TYPES)[number];

/**
 * Chiều cao khung tự do trên trang web (chiều ngang luôn 1760 như mặt thiệp, nên cỡ chữ và
 * đường gióng dùng chung): banner 2:1, khung ngang như thiệp, khung đứng 4:5.
 */
export const BOARD_HEIGHTS = [880, 1240, 2200] as const;
export type BoardHeight = (typeof BOARD_HEIGHTS)[number];

export const COUNTER_MODES = ["since", "until"] as const;
export type CounterMode = (typeof COUNTER_MODES)[number];

export interface MemoryItem {
  id: string;
  image?: WebImage;
  date?: string;
  caption: string;
}

/** Một phần trên trang web cuộn dọc của người nhận (FR-10). */
export type WebSection =
  | { id: string; type: "hero"; enabled: boolean; image?: WebImage; lead: string }
  | { id: string; type: "first_day"; enabled: boolean; image?: WebImage; date?: string; text: string }
  | { id: string; type: "memories"; enabled: boolean; title?: string; items: MemoryItem[] }
  | { id: string; type: "reasons"; enabled: boolean; title?: string; items: string[] }
  | { id: string; type: "counter"; enabled: boolean; date: string; label: string; mode: CounterMode }
  | { id: string; type: "message"; enabled: boolean; title: string; body: string }
  | { id: string; type: "interact"; enabled: boolean }
  | { id: string; type: "ending"; enabled: boolean; text: string; signature?: string }
  /** Khung kéo thả tự do (banner, collage ảnh, sticker, chữ). Cùng dạng với một mặt thiệp. */
  | {
      id: string;
      type: "board";
      enabled: boolean;
      height: BoardHeight;
      background: BackgroundConfig;
      elements: CanvasElement[];
    };

export type BoardSection = Extract<WebSection, { type: "board" }>;

export const WEB_THEMES = ["warm_letter", "starry_night", "pastel", "doodle"] as const;
export type WebThemeId = (typeof WEB_THEMES)[number];

export const WEB_INTENSITIES = ["light", "medium", "rich"] as const;
export type WebIntensity = (typeof WEB_INTENSITIES)[number];

export const WEB_OPEN_EFFECTS = ["wax_seal", "ribbon", "hold_heart"] as const;
export type WebOpenEffect = (typeof WEB_OPEN_EFFECTS)[number];

export const WEB_TEXT_REVEALS = ["slide", "typewriter", "lines"] as const;
export type WebTextReveal = (typeof WEB_TEXT_REVEALS)[number];

export const WEB_PHOTO_EFFECTS = ["polaroid", "flip", "drop"] as const;
export type WebPhotoEffect = (typeof WEB_PHOTO_EFFECTS)[number];

export const WEB_PARTICLE_EFFECTS = ["none", "hearts", "stars", "petals"] as const;
export type WebParticleEffect = (typeof WEB_PARTICLE_EFFECTS)[number];

export const WEB_COUNTER_EFFECTS = ["count_up", "flip_calendar"] as const;
export type WebCounterEffect = (typeof WEB_COUNTER_EFFECTS)[number];

export const WEB_CELEBRATE_EFFECTS = ["confetti", "fireworks", "heart_rain"] as const;
export type WebCelebrateEffect = (typeof WEB_CELEBRATE_EFFECTS)[number];

/** Tùy chỉnh phong cách và hiệu ứng trang web (FR-15). Mục để trống lấy theo phong cách. */
export interface WebStyleConfig {
  theme: WebThemeId;
  intensity: WebIntensity;
  accent?: string;
  font?: FontName;
  /** Phóng to, thu nhỏ chữ trên trang web (0.85..1.35, mặc định 1). */
  textScale?: number;
  open?: WebOpenEffect;
  textReveal?: WebTextReveal;
  photo?: WebPhotoEffect;
  particle?: WebParticleEffect;
  counter?: WebCounterEffect;
  celebrate?: WebCelebrateEffect;
}

export interface WebConfig {
  recipientName: string;
  senderName: string;
  envelopeColor: string;
  waxSealColor: string;
  audio: { enabled: boolean; trackId: string; startTime: number; volume: number };
  blocks: {
    acceptButton?: {
      enabled: boolean;
      question: string;
      yesText: string;
      noText: string;
      dodgeNo: boolean;
    };
    rsvp?: { enabled: boolean; eventDate: string; locationName: string; mapsUrl: string };
    poll?: { enabled: boolean; question: string; options: string[] };
  };
  sections?: WebSection[];
  style?: WebStyleConfig;
}

export interface LetterPayload {
  template_type: TemplateType;
  title: string;
  canvas_data: CanvasData;
  web_config: WebConfig;
}

export type ActionType = "accept" | "rsvp" | "poll";

export interface LetterResponse {
  id: string;
  responder_name: string | null;
  action_type: ActionType;
  status: string | null;
  guest_count: number | null;
  poll_option: string | null;
  message: string | null;
  created_at: string;
}

/** Dữ liệu công khai của thư: không bao giờ chứa owner_id hay IP hash. */
export interface PublicLetter extends LetterPayload {
  slug: string;
  expires_at: string;
}

/** Chi tiết thiệp cho chính chủ (/api/me/letters/[id]). */
export interface ManagedLetter extends PublicLetter {
  id: string;
  view_count: number;
  created_at: string;
  responses: LetterResponse[];
}

/** Một dòng trong danh sách Thiệp của tôi (/api/me/letters). */
export interface LetterSummary {
  id: string;
  slug: string;
  title: string;
  template_type: TemplateType;
  /** Bìa trước, để vẽ ảnh thu nhỏ. */
  front: CardFace | null;
  view_count: number;
  response_count: number;
  expires_at: string;
  created_at: string;
}
