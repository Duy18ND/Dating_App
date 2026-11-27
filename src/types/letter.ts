import type { FontName } from "@/lib/font-names";
import type { PrintSize } from "@/lib/print-config";

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

export interface CanvasElement {
  id: string;
  type: ElementType;
  // Góc trên trái theo hệ tọa độ logic 1240 x 1754; rotation tính bằng độ quanh điểm này.
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
  // SVG icon
  iconId?: string;
  // Ghi tay (mỗi phần tử là một nét [x1, y1, x2, y2, ...] tương đối so với x, y) và vùng kẻ
  points?: number[];
  strokeWidth?: number;
  lineStyle?: "ruled" | "dot_grid";
}

export interface CanvasData {
  width: 1240;
  height: 1754;
  defaultPrintSize: PrintSize;
  background: BackgroundConfig;
  elements: CanvasElement[];
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

/** Dữ liệu công khai của thư: không bao giờ chứa edit_token hay IP hash. */
export interface PublicLetter extends LetterPayload {
  slug: string;
  expires_at: string;
}

export interface ManagedLetter extends PublicLetter {
  view_count: number;
  created_at: string;
  responses: LetterResponse[];
}
