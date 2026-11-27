// Bộ in mini (SRS v1.3, mục 2.2). Mọi số đo in ấn chỉ lấy từ đây.
export const PRINT_CONFIG = {
  /** Mỗi mặt thiệp: 105 x 74 mm ↔ 1760 x 1240 px logic (~16,76 px/mm). */
  CANVAS: {
    width: 1760,
    height: 1240,
    safeMarginPx: 84, // 5 mm
    minQrPx: 340, // ~20,3 mm
    defaultQrPx: 380, // ~22,7 mm
    minFontPx: 48, // ~2,9 mm
  },
  PAPER_A4_MM: { width: 210, height: 297 },
  /** Màu/ảnh nền in tràn ra ngoài đường cắt để cắt lệch không lộ viền trắng. */
  BLEED_MM: 2,
  CARD_FACE_MM: { width: 105, height: 74 },
  /**
   * Thiệp gập = 2 dải 210 x 74 mm (ngoài: [Bìa sau | Bìa trước], trong: [Trang viết tay | Lời mời]).
   * Trên A4 mỗi dải xoay 90° thành 74 x 210, đặt cạnh nhau.
   */
  CARD_STRIPS_MM: { length: 210, height: 74, gap: 14, marginX: 24, y: 43.5 },
  /** Thư gấp 3: dải 105 x 222 mm, mỗi ô 105 x 74. */
  LETTER_MM: { width: 105, height: 222, offsetX: 52.5, offsetY: 37.5, panelHeight: 74, lineGap: 8 },
  /** Phong bì C7 thành phẩm 114 x 81 mm; trải phẳng 144 x 188 mm. */
  ENVELOPE_C7_FLAT_MM: {
    bodyWidth: 114,
    bodyHeight: 81,
    sideFlap: 15,
    bottomFlap: 62,
    topFlap: 45,
    offsetX: 33,
    offsetY: 54.5,
  },
  EXPORT_PIXEL_RATIO: 2,
} as const;

/** px logic trên mỗi mm của mặt thiệp. */
export const PX_PER_MM = PRINT_CONFIG.CANVAS.width / PRINT_CONFIG.CARD_FACE_MM.width;
