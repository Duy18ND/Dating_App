export const PRINT_CONFIG = {
  CANVAS: { width: 1240, height: 1754, safeMarginPx: 94, minQrPx: 240, defaultQrPx: 280 },
  PAPER_A4_MM: { width: 210, height: 297 },
  CARD_SIZES_MM: {
    A6: { width: 105, height: 148, offsetX: 52.5, offsetY: 74.5 }, // Mặc định (nhỏ gọn)
    A5: { width: 148, height: 210, offsetX: 31.0, offsetY: 43.5 }, // Tùy chọn gấp đôi
  },
  ENVELOPE_C6_FLAT_MM: {
    bodyWidth: 162, bodyHeight: 114,
    sideFlap: 15, bottomFlap: 95, topFlap: 65,
    marginX: 9.0, marginY: 11.5, // Tổng 192 x 274 mm, lọt chuẩn A4
  },
  EXPORT_PIXEL_RATIO: 2,
} as const;

export type PrintSize = keyof typeof PRINT_CONFIG.CARD_SIZES_MM;
