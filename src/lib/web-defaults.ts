import rawDefaults from "../../docs/gemini-output/T-35-scroll-web-defaults.json";
import type { CounterMode, TemplateType, WebSection } from "@/types/letter";

type RawSection =
  | { type: "hero"; lead: string }
  | { type: "first_day"; text: string }
  | { type: "memories"; items: { caption: string }[] }
  | { type: "reasons"; items: string[] }
  | { type: "counter"; label: string; mode: CounterMode }
  | { type: "message"; title: string; body: string }
  | { type: "interact" }
  | { type: "ending"; text: string };

const DEFAULTS = rawDefaults as Record<TemplateType, RawSection[]>;

const DEFAULT_DATES: Record<TemplateType, { firstDay?: string; counter: string }> = {
  confession: { firstDay: "2025-10-14", counter: "2025-10-14" },
  wedding: { counter: "2027-01-10" },
  dinner: { counter: "2026-12-05" },
  holiday: { counter: "2026-12-25" },
};

const DEFAULT_SIGNATURES: Record<TemplateType, string> = {
  confession: "Từ người hay ngại",
  wedding: "Cô dâu & Chú rể",
  dinner: "Người mời cực có tâm",
  holiday: "Bạn thân của cậu",
};

const CLEAN_HERO_LEAD: Record<TemplateType, string> = {
  confession: "Có vài điều nhỏ mình muốn gửi riêng cho cậu.",
  wedding: "Rất mong có bạn chung vui trong ngày trọng đại của tụi mình.",
  dinner: "Cho phép mình mời cậu một bữa thật ngon nhé.",
  holiday: "Gửi cậu một tấm thiệp nhỏ kèm thật nhiều niềm vui.",
};

const CLEAN_MESSAGE_TITLE: Record<TemplateType, string> = {
  confession: "Lời muốn gửi cậu",
  wedding: "Lời mời thân thương",
  dinner: "Lời hẹn của tụi mình",
  holiday: "Lời chúc gửi cậu",
};

/**
 * Nội dung trang web cuộn dọc mặc định cho 4 mẫu:
 * - `editor` (mặc định): gọn gàng, không nhồi text demo thừa có dấu `[...]`, chỉ bật sẵn các phần chính.
 * - `preview`: dùng cho `/xem-thu/[mau]` để khách xem thử thấy đủ nội dung mẫu T-35.
 */
export function defaultWebSections(
  type: TemplateType,
  mode: "editor" | "preview" = "editor",
): WebSection[] {
  const list = DEFAULTS[type] ?? [];
  const dates = DEFAULT_DATES[type];
  const isPreview = mode === "preview";

  return list.map((section, idx): WebSection => {
    const id = `${type}-sec-${idx}`;
    switch (section.type) {
      case "hero":
        return {
          id,
          type: "hero",
          enabled: true,
          lead: isPreview ? section.lead : CLEAN_HERO_LEAD[type],
        };
      case "first_day":
        return {
          id,
          type: "first_day",
          enabled: isPreview,
          date: isPreview ? dates.firstDay : undefined,
          text: isPreview ? section.text : "",
        };
      case "memories":
        return {
          id,
          type: "memories",
          enabled: isPreview,
          title:
            type === "wedding"
              ? "Chuyện tình của tụi mình"
              : type === "holiday"
                ? "Album kỷ niệm nhỏ"
                : "Những khoảnh khắc đáng nhớ",
          items: isPreview
            ? section.items.map((item, mIdx) => ({
                id: `${type}-mem-${mIdx}`,
                caption: item.caption,
              }))
            : [{ id: `${type}-mem-0`, caption: "" }],
        };
      case "reasons":
        return {
          id,
          type: "reasons",
          enabled: isPreview,
          title: "Điều mình thích ở cậu",
          items: isPreview ? [...section.items] : [""],
        };
      case "counter":
        return {
          id,
          type: "counter",
          enabled: isPreview,
          date: isPreview ? dates.counter : "",
          label: isPreview ? section.label : "",
          mode: section.mode,
        };
      case "message":
        return {
          id,
          type: "message",
          enabled: true,
          title: isPreview ? section.title : CLEAN_MESSAGE_TITLE[type],
          body: isPreview ? section.body : "",
        };
      case "interact":
        return { id, type: "interact", enabled: true };
      case "ending":
        return {
          id,
          type: "ending",
          enabled: true,
          text: isPreview ? section.text : "",
          signature: isPreview ? DEFAULT_SIGNATURES[type] : "",
        };
    }
  });
}
