import {
  Be_Vietnam_Pro,
  Charm,
  Cormorant_Garamond,
  Dancing_Script,
  Mali,
  Playfair_Display,
} from "next/font/google";

const beVietnam = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-be-vietnam",
});
const cormorant = Cormorant_Garamond({
  subsets: ["latin", "vietnamese"],
  variable: "--nf-cormorant",
  preload: false,
});
const playfair = Playfair_Display({
  subsets: ["latin", "vietnamese"],
  variable: "--nf-playfair",
  preload: false,
});
const charm = Charm({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "700"],
  variable: "--nf-charm",
  preload: false,
});
const dancing = Dancing_Script({
  subsets: ["latin", "vietnamese"],
  variable: "--nf-dancing",
  preload: false,
});
const mali = Mali({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "600"],
  variable: "--nf-mali",
  preload: false,
});

/**
 * canvas_data lưu tên font logic (khóa của object này). Canvas không hiểu biến CSS,
 * nên khi vẽ phải đổi sang `style.fontFamily` mà next/font sinh ra.
 */
export const LETTER_FONTS = {
  "Be Vietnam Pro": beVietnam,
  "Cormorant Garamond": cormorant,
  "Playfair Display": playfair,
  Charm: charm,
  "Dancing Script": dancing,
  Mali: mali,
} as const;

export const fontVariables = Object.values(LETTER_FONTS)
  .map((font) => font.variable)
  .join(" ");
