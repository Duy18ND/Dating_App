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

/**
 * Nội dung trang web cuộn dọc mặc định cho 4 mẫu (T-35), lấy từ
 * `docs/gemini-output/T-35-scroll-web-defaults.json` đúng thứ tự FR-01.
 */
export function defaultWebSections(type: TemplateType): WebSection[] {
  const list = DEFAULTS[type] ?? [];
  const dates = DEFAULT_DATES[type];
  return list.map((section, idx): WebSection => {
    const id = `${type}-sec-${idx}`;
    switch (section.type) {
      case "hero":
        return { id, type: "hero", enabled: true, lead: section.lead };
      case "first_day":
        return {
          id,
          type: "first_day",
          enabled: true,
          date: dates.firstDay,
          text: section.text,
        };
      case "memories":
        return {
          id,
          type: "memories",
          enabled: true,
          title:
            type === "wedding"
              ? "Chuyện tình của tụi mình"
              : type === "holiday"
                ? "Album kỷ niệm nhỏ"
                : "Những khoảnh khắc mình nhớ mãi",
          items: section.items.map((item, mIdx) => ({
            id: `${type}-mem-${mIdx}`,
            caption: item.caption,
          })),
        };
      case "reasons":
        return {
          id,
          type: "reasons",
          enabled: true,
          title: "Điều mình thích ở cậu",
          items: [...section.items],
        };
      case "counter":
        return {
          id,
          type: "counter",
          enabled: true,
          date: dates.counter,
          label: section.label,
          mode: section.mode,
        };
      case "message":
        return {
          id,
          type: "message",
          enabled: true,
          title: section.title,
          body: section.body,
        };
      case "interact":
        return { id, type: "interact", enabled: true };
      case "ending":
        return {
          id,
          type: "ending",
          enabled: true,
          text: section.text,
          signature: DEFAULT_SIGNATURES[type],
        };
    }
  });
}
