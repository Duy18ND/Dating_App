import {
  Baloo_2,
  Be_Vietnam_Pro,
  Charm,
  Cormorant_Garamond,
  Dancing_Script,
  Great_Vibes,
  Lobster,
  Mali,
  Pacifico,
  Patrick_Hand,
  Playfair_Display,
  Quicksand,
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

// Phông thêm để trang trí; chỉ tải khi thật sự được dùng (preload: false).
const baloo = Baloo_2({ subsets: ["latin", "vietnamese"], variable: "--nf-baloo", preload: false });
const quicksand = Quicksand({
  subsets: ["latin", "vietnamese"],
  variable: "--nf-quicksand",
  preload: false,
});
const patrick = Patrick_Hand({
  subsets: ["latin", "vietnamese"],
  weight: "400",
  variable: "--nf-patrick",
  preload: false,
});
const lobster = Lobster({
  subsets: ["latin", "vietnamese"],
  weight: "400",
  variable: "--nf-lobster",
  preload: false,
});
const pacifico = Pacifico({
  subsets: ["latin", "vietnamese"],
  weight: "400",
  variable: "--nf-pacifico",
  preload: false,
});
const greatVibes = Great_Vibes({
  subsets: ["latin", "vietnamese"],
  weight: "400",
  variable: "--nf-great-vibes",
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
  "Baloo 2": baloo,
  Quicksand: quicksand,
  "Patrick Hand": patrick,
  Lobster: lobster,
  Pacifico: pacifico,
  "Great Vibes": greatVibes,
} as const;

export const fontVariables = Object.values(LETTER_FONTS)
  .map((font) => font.variable)
  .join(" ");
