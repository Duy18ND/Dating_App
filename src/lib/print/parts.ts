import { PRINT_CONFIG, PX_PER_MM } from "@/lib/print-config";

/**
 * Hợp đồng chung cho các hàm vẽ phần in (T-26). Dùng cho PDF (T-29) và xem trước cả bộ (T-37),
 * nên bản xem trước luôn giống bản in.
 *
 * Mỗi phần được vẽ ra một canvas phủ cả vùng tràn màu: kích thước
 * (width + 2*bleed) x (height + 2*bleed) mm nhân pxPerMm; đường cắt nằm ở (bleed, bleed).
 * Nền (màu/ảnh) phải phủ kín cả vùng tràn; chữ và hình nằm trong vùng cắt.
 */

export type PrintPartId =
  | "cardFront" // bìa trước: chụp Stage mặt front
  | "cardInside" // trang Lời mời + QR: chụp Stage mặt inside
  | "cardBack" // bìa sau: chữ lồng tên nhỏ (T-31)
  | "writingPage" // trang viết tay trong thiệp (T-30)
  | "letter" // thư gấp 3 (T-30)
  | "envelopeFlap"; // phần trang trí nắp trên phong bì, chưa xoay (T-31; T-29 xoay 180°)

const { CARD_FACE_MM: face, LETTER_MM: letter, ENVELOPE_C7_FLAT_MM: envelope } = PRINT_CONFIG;

/** Kích thước thành phẩm (không gồm tràn màu) của từng phần, đơn vị mm. */
export const PART_SIZE_MM: Record<PrintPartId, { width: number; height: number }> = {
  cardFront: face,
  cardInside: face,
  cardBack: face,
  writingPage: face,
  letter: { width: letter.width, height: letter.height },
  envelopeFlap: { width: envelope.bodyWidth, height: envelope.topFlap },
};

export interface RenderOptions {
  /** Độ phân giải ảnh. Mặt thiệp dùng FACE_PX_PER_MM; các phần còn lại dùng PRINT_PX_PER_MM. */
  pxPerMm: number;
  /** false: bỏ màu/ảnh nền để in lên giấy màu hoặc Kraft. */
  background: boolean;
  /** Tràn màu mỗi phía, mặc định PRINT_CONFIG.BLEED_MM. Xem trước trên màn hình dùng 0. */
  bleedMm?: number;
}

export interface RenderedPart {
  canvas: HTMLCanvasElement;
  widthMm: number;
  heightMm: number;
  bleedMm: number;
  /** false khi phần này có vùng trong suốt (đã tắt nền): PDF phải nhúng PNG thay vì JPEG. */
  opaque: boolean;
}

export type PartRenderer<Input> = (input: Input, options: RenderOptions) => Promise<RenderedPart>;

/** Mặt thiệp chụp từ Stage với pixelRatio xuất = ~33,5 px/mm (~850 DPI). */
export const FACE_PX_PER_MM = PX_PER_MM * PRINT_CONFIG.EXPORT_PIXEL_RATIO;

/**
 * Các phần vẽ bằng Canvas 2D: 14 px/mm (~356 DPI). Đủ nét khi in, và thư 105 x 222 mm chỉ
 * khoảng 4,7 triệu px, dưới giới hạn ~16,7 triệu px mỗi canvas của Safari iOS.
 */
export const PRINT_PX_PER_MM = 14;

/** Safari iOS từ chối canvas lớn hơn mức này (tính theo số điểm ảnh). */
export const MAX_CANVAS_PIXELS = 16_777_216;

/** Tạo canvas đúng kích thước cho một phần, kèm hệ trục đã dịch tới góc vùng cắt, đơn vị mm. */
export function createPartCanvas(part: PrintPartId, options: RenderOptions) {
  const size = PART_SIZE_MM[part];
  const bleedMm = options.bleedMm ?? PRINT_CONFIG.BLEED_MM;
  const canvas = document.createElement("canvas");
  canvas.width = Math.round((size.width + bleedMm * 2) * options.pxPerMm);
  canvas.height = Math.round((size.height + bleedMm * 2) * options.pxPerMm);
  if (canvas.width * canvas.height > MAX_CANVAS_PIXELS) {
    throw new Error(`Ảnh ${part} quá lớn cho trình duyệt, hãy giảm pxPerMm`);
  }
  const ctx = canvas.getContext("2d")!;
  ctx.scale(options.pxPerMm, options.pxPerMm);
  ctx.translate(bleedMm, bleedMm);
  return { canvas, ctx, size, bleedMm };
}
