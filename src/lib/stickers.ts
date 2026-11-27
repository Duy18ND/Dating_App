import type { TemplateType } from "@/types/letter";
import type { IconCategory } from "./icons";
import list from "./stickers.json";

export const STICKER_SIZE_PX = 400;

export const MEMES = list.map(({ id, label }) => ({
  id,
  label,
  src: `/stickers/memes/${id}.webp`,
}));

export type StickerTab = IconCategory | "meme";

/** Tab mở sẵn theo ngữ cảnh của mẫu thư (FR-04). */
export const DEFAULT_STICKER_TAB: Record<TemplateType, StickerTab> = {
  confession: "minimal",
  wedding: "minimal",
  dinner: "meme",
  holiday: "meme",
};
