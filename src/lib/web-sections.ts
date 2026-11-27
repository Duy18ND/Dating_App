import { nanoid } from "nanoid";
import { LIMITS } from "@/lib/validation";
import { WEB_SECTION_TYPES, type WebSection, type WebSectionType } from "@/types/letter";

export const SECTION_LABELS: Record<WebSectionType, string> = {
  hero: "Mở đầu",
  first_day: "Ngày đầu tiên",
  memories: "Kỷ niệm",
  reasons: "Điều mình thích ở bạn",
  counter: "Con số",
  message: "Lời bày tỏ / Lời chúc",
  interact: "Câu hỏi & Tương tác",
  ending: "Lời kết",
  board: "Khung tự do (banner)",
};

/** Phần bật nhưng để trống thì tự ẩn trên trang người nhận (FR-10). */
export function isSectionEmpty(section: WebSection, hasBlocks: boolean): boolean {
  switch (section.type) {
    case "hero":
      return !section.lead.trim() && !section.image;
    case "first_day":
      return !section.text.trim() && !section.image;
    case "memories":
      return section.items.every((item) => !item.caption.trim() && !item.image);
    case "reasons":
      return section.items.every((item) => !item.trim());
    case "counter":
      return !section.date.trim() && !section.label.trim();
    case "message":
      return !section.title.trim() && !section.body.trim();
    case "interact":
      return !hasBlocks;
    case "ending":
      return !section.text.trim() && !section.signature?.trim();
    case "board":
      return section.elements.length === 0 && section.background.type !== "image";
  }
}

/** Một phần trống, đang bật, để người dùng thêm loại mà mẫu chưa có. */
export function newSection(type: WebSectionType): WebSection {
  const base = { id: `${type}-${nanoid(8)}`, enabled: true };
  switch (type) {
    case "hero":
      return { ...base, type, lead: "" };
    case "first_day":
      return { ...base, type, text: "" };
    case "memories":
      return { ...base, type, items: [{ id: nanoid(8), caption: "" }] };
    case "reasons":
      return { ...base, type, items: [""] };
    case "counter":
      return { ...base, type, date: "", label: "", mode: "since" };
    case "message":
      return { ...base, type, title: "", body: "" };
    case "interact":
      return { ...base, type };
    case "ending":
      return { ...base, type, text: "" };
    case "board":
      return {
        ...base,
        type,
        height: 880,
        background: { type: "color", value: "#FFFDF9", overlayOpacity: 0 },
        elements: [],
      };
  }
}

/** Các loại có thể thêm: mỗi loại một lần, riêng khung tự do được thêm tới `maxBoards`. */
export const missingSectionTypes = (sections: WebSection[]): WebSectionType[] =>
  WEB_SECTION_TYPES.filter((type) => {
    const count = sections.filter((s) => s.type === type).length;
    return type === "board" ? count < LIMITS.maxBoards : count === 0;
  });

/** Chèn phần mới trước Lời kết (nếu có) để lời kết vẫn ở cuối. */
export function insertSection(sections: WebSection[], section: WebSection): WebSection[] {
  const ending = sections.findIndex((s) => s.type === "ending");
  if (ending < 0 || section.type === "ending") return [...sections, section];
  return [...sections.slice(0, ending), section, ...sections.slice(ending)];
}
