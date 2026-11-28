// Bộ in mini (SRS v1.7, mục 2.2). Mọi số đo in ấn chỉ lấy từ đây.
export const PRINT_CONFIG = {
  /** Mỗi mặt thiệp: 105 x 74 mm ↔ 1760 x 1240 px logic (~16,76 px/mm). */
  CANVAS: {
    width: 1760,
    height: 1240,
    safeMarginPx: 84, // 5 mm
    minQrPx: 252, // ~15 mm
    defaultQrPx: 280, // ~16,7 mm
    minFontPx: 48, // ~2,9 mm
  },
  PAPER_A4_MM: { width: 210, height: 297 },
  /** Màu/ảnh nền in tràn ra ngoài đường cắt để cắt lệch không lộ viền trắng. */
  BLEED_MM: 2,
  CARD_FACE_MM: { width: 105, height: 74 },
  /**
   * v1.8: thiệp mini phẳng 105 x 74 mm in HAI MẶT ở nửa dưới tờ A4 (y = 207..281).
   * Trang 1 in mặt trước, trang 2 in mặt sau (in đảo theo cạnh dài). Không gập, không dán lưng.
   * Dấu cắt kết thúc ở y = 289, còn cách mép giấy 8 mm cho lề không in được của máy in nhà.
   */
  MINI_CARD_MM: { x: 52.5, y: 207 },
  /** Thư gấp 3: dải 105 x 222 mm, mỗi ô 105 x 74. (v1.7: chưa có trong PDF mặc định.) */
  LETTER_MM: { width: 105, height: 222, offsetX: 52.5, offsetY: 37.5, panelHeight: 74, lineGap: 8 },
  /**
   * Phong bì C7 thành phẩm 114 x 81 mm; trải phẳng liền một mảnh 144 x 188 mm ở nửa trên A4
   * (y = 8..196). Nắp trên bo tròn cao 45 mm gồm vòm 35 mm + tai cài 22 x 10 mm ở đỉnh.
   * Khe cài 26 mm nằm trên nắp đáy, cách nếp gấp đáy 45 mm: khi gấp, khe nằm cách mép trên
   * thân 81 - 45 = 36 mm, tức giữa chân tai cài (35 mm) và mũi tai (45 mm).
   */
  ENVELOPE_C7_FLAT_MM: {
    bodyWidth: 114,
    bodyHeight: 81,
    sideFlap: 15,
    bottomFlap: 62,
    topFlap: 45,
    tuckTab: { width: 22, height: 10 },
    tuckSlit: { width: 26, depth: 45 },
    /** Hai tai bên và nắp đáy vát vào ở hai đầu. */
    sideFlapTaper: 8,
    bottomFlapTaper: 8,
    /** Vùng keo trên tai bên: chỉ nằm trong phần bị nắp đáy che (cách hai đầu 8 mm). */
    glueInset: 8,
    offsetX: 33,
    offsetY: 8,
  },
  EXPORT_PIXEL_RATIO: 2,
} as const;

/** px logic trên mỗi mm của mặt thiệp. */
export const PX_PER_MM = PRINT_CONFIG.CANVAS.width / PRINT_CONFIG.CARD_FACE_MM.width;
