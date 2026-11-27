/** Danh sách font được phép trong lá thư. Tách riêng để server/test dùng mà không kéo theo next/font. */
export const FONT_NAMES = [
  "Be Vietnam Pro",
  "Cormorant Garamond",
  "Playfair Display",
  "Charm",
  "Dancing Script",
  "Mali",
  "Baloo 2",
  "Quicksand",
  "Patrick Hand",
  "Lobster",
  "Pacifico",
  "Great Vibes",
] as const;

export type FontName = (typeof FONT_NAMES)[number];
