// 20 icon nội bộ, viewBox 24 x 24. Gemini có thể thay path mà không phải sửa code khác (giữ nguyên id).

export type IconCategory = "minimal" | "flora" | "doodle";

export interface LetterIcon {
  id: string;
  label: string;
  category: IconCategory;
  d: string;
  /** true: tô đặc bằng màu đã chọn; false: chỉ vẽ nét. */
  filled?: boolean;
}

export const ICON_VIEWBOX = 24;

export const ICON_CATEGORIES: { id: IconCategory; label: string }[] = [
  { id: "minimal", label: "Tối giản & Cưới" },
  { id: "flora", label: "Hoa khô & Dấu sáp" },
  { id: "doodle", label: "Doodle vẽ tay" },
];

const HEART =
  "M12 20 C5 15 3 12 3 8.5 C3 6 5 4 7.5 4 C9.5 4 11 5.2 12 7 C13 5.2 14.5 4 16.5 4 C19 4 21 6 21 8.5 C21 12 19 15 12 20 Z";

export const ICONS: LetterIcon[] = [
  { id: "heart", label: "Trái tim", category: "minimal", d: HEART, filled: true },
  { id: "heart-line", label: "Tim viền", category: "minimal", d: HEART },
  {
    id: "rings", label: "Nhẫn cưới", category: "minimal",
    d: "M9 8 a6 6 0 1 0 0.01 0 Z M15 8 a6 6 0 1 0 0.01 0 Z M7 5 L9 2.5 L11 5 L9 8 Z",
  },
  {
    id: "star", label: "Ngôi sao", category: "minimal", filled: true,
    d: "M12 2 L15 8.6 L22 9.3 L16.8 14.1 L18.2 21 L12 17.4 L5.8 21 L7.2 14.1 L2 9.3 L9 8.6 Z",
  },
  {
    id: "sparkle", label: "Lấp lánh", category: "minimal", filled: true,
    d: "M12 2 C13 9 15 11 22 12 C15 13 13 15 12 22 C11 15 9 13 2 12 C9 11 11 9 12 2 Z",
  },
  { id: "envelope", label: "Phong thư", category: "minimal", d: "M3 6 H21 V18 H3 Z M3 6 L12 13 L21 6" },
  {
    id: "toast", label: "Cụng ly", category: "minimal",
    d: "M5 3 H11 L10 9 C9.7 11 6.3 11 6 9 Z M8 10.5 V20 M5.5 20 H10.5 M13 3 H19 L18 9 C17.7 11 14.3 11 14 9 Z M16 10.5 V20 M13.5 20 H18.5",
  },
  {
    id: "flower", label: "Bông hoa", category: "flora",
    d: "M12 9.5 a2.5 2.5 0 1 0 0.01 0 Z M12 9.5 C8 6 9 2 12 2 C15 2 16 6 12 9.5 M14.4 11.2 C18 8 22 10 21 13 C20 16 16 15 14.4 11.2 M13.5 14 C17 16 17 21 14 21.5 C11 22 11 17 13.5 14 M10.5 14 C7 16 7 21 10 21.5 C13 22 13 17 10.5 14 M9.6 11.2 C6 8 2 10 3 13 C4 16 8 15 9.6 11.2",
  },
  {
    id: "leaf", label: "Chiếc lá", category: "flora",
    d: "M4 20 C4 9 11 4 20 4 C20 13 15 20 4 20 Z M4 20 L15 9",
  },
  {
    id: "branch", label: "Cành lá", category: "flora",
    d: "M5 22 C9 16 13 10 19 2 M9 16 C5 16 3 13 3 11 C7 11 9 13 9 16 M9 16 C13 17 16 16 17 14 C14 12 11 13 9 16 M13 10 C10 9 9 6 9 4 C12 5 14 7 13 10 M13 10 C16 11 19 10 20 8 C18 7 15 7 13 10",
  },
  {
    id: "tulip", label: "Tulip", category: "flora",
    d: "M7 4 L10 7 L12 3 L14 7 L17 4 C18 10 16 13 12 13 C8 13 6 10 7 4 Z M12 13 V22 M12 20 C8 20 6 18 6 15 C10 15 12 17 12 20 M12 18 C16 18 18 16 18 13 C14 13 12 15 12 18",
  },
  {
    id: "wax-seal", label: "Dấu sáp", category: "flora",
    d: "M12 2 C15 2 15.5 4 17.5 4.8 C20 5.5 21.5 7 20.8 9.5 C20.4 11.5 22.5 13 21 15.5 C19.8 17.5 18 17 16.8 19 C15.5 21.2 13.5 22.5 11.5 21.2 C9.8 20.2 8 21.8 5.8 20.2 C3.8 18.8 4.5 16.8 3.2 15.2 C1.5 13.2 2.5 11.5 3.3 10 C4.2 8.2 2.8 6.2 5 4.8 C6.8 3.8 8 4.5 9.5 3.2 C10.2 2.5 11 2 12 2 Z M12 6.5 a5.5 5.5 0 1 0 0.01 0 Z",
  },
  {
    id: "wreath", label: "Vòng lá", category: "flora",
    d: "M9 21 C4 19 2 14 3 9 M3 9 C5 9 6 10 6 12 C4 12 3 11 3 9 M3.5 15 C5.5 14 7 15 7.5 17 C5.5 17.5 4 17 3.5 15 M4 7 C4 5 5.5 3.5 7.5 3.5 C7.5 5.5 6 7 4 7 M15 21 C20 19 22 14 21 9 M21 9 C19 9 18 10 18 12 C20 12 21 11 21 9 M20.5 15 C18.5 14 17 15 16.5 17 C18.5 17.5 20 17 20.5 15 M20 7 C20 5 18.5 3.5 16.5 3.5 C16.5 5.5 18 7 20 7",
  },
  {
    id: "squiggle", label: "Nét lượn", category: "doodle",
    d: "M2 14 C5 6 8 6 9 12 C10 18 13 18 15 12 C17 6 20 6 22 11",
  },
  {
    id: "scribble-circle", label: "Vòng khoanh", category: "doodle",
    d: "M15 4 C7 2 2 7 3 13 C4 19 12 22 18 18 C23 14 21 6 14 4.5 C11 4 8 5 6 7",
  },
  {
    id: "arrow", label: "Mũi tên", category: "doodle",
    d: "M3 18 C7 8 13 6 20 9 M15 4.5 L20.5 9.2 L14 12",
  },
  { id: "underline", label: "Gạch chân", category: "doodle", d: "M2 13 C8 10 15 10 22 11 M5 17 C10 15 15 15 19 16" },
  {
    id: "smile", label: "Mặt cười", category: "doodle",
    d: "M12 2 a10 10 0 1 0 0.01 0 Z M8.5 9 V10 M15.5 9 V10 M7.5 14 C9 18 15 18 16.5 14",
  },
  { id: "crown", label: "Vương miện", category: "doodle", d: "M3 19 L2 7 L8 12 L12 4 L16 12 L22 7 L21 19 Z" },
  {
    id: "music-note", label: "Nốt nhạc", category: "doodle",
    d: "M9 18 V5 L20 3 V16 M9 18 a3 2.5 0 1 1 -0.01 -0.01 M20 16 a3 2.5 0 1 1 -0.01 -0.01",
  },
];

export const findIcon = (id: string | undefined) => ICONS.find((icon) => icon.id === id);
