"use client";

import { Shuffle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEditorStore } from "@/lib/editor/store";
import { FONT_NAMES, type FontName } from "@/lib/font-names";
import { cn } from "@/lib/utils";
import {
  defaultWebStyle,
  EFFECT_CATALOG,
  isReadableAccent,
  randomWebStyle,
  resolveWebStyle,
  WEB_THEME_LIST,
  type EffectOption,
} from "@/lib/web-styles";
import type { WebStyleConfig, WebThemeId } from "@/types/letter";
import { ColorField } from "../ColorField";
import { Choice, Field, inputClass, Section } from "../ui";

/** Xóa mọi tùy chỉnh riêng: chọn một phong cách là đủ bộ (FR-15). */
const NO_OVERRIDES: Omit<WebStyleConfig, "theme" | "intensity"> = {
  accent: undefined,
  font: undefined,
  open: undefined,
  textReveal: undefined,
  photo: undefined,
  particle: undefined,
  counter: undefined,
  celebrate: undefined,
};

const ACCENTS = ["#8E2424", "#B83B63", "#B83D24", "#2F4A3A", "#243B5A", "#E8C36B"];

const EFFECTS = [
  { key: "open", label: "Cách mở thư" },
  { key: "textReveal", label: "Chữ xuất hiện" },
  { key: "photo", label: "Ảnh kỷ niệm" },
  { key: "particle", label: "Hiệu ứng nền" },
  { key: "counter", label: "Con số" },
  { key: "celebrate", label: "Khi bấm Đồng ý" },
] as const;

function EffectSelect<T extends string>({
  label,
  options,
  value,
  fallback,
  onChange,
}: {
  label: string;
  options: EffectOption<T>[];
  value: T | undefined;
  fallback: T;
  onChange: (value: T | undefined) => void;
}) {
  const fallbackLabel = options.find((o) => o.id === fallback)?.label ?? fallback;
  return (
    <Field label={label}>
      <select
        className={inputClass}
        value={value ?? ""}
        onChange={(event) => onChange((event.target.value || undefined) as T | undefined)}
      >
        <option value="">Theo phong cách ({fallbackLabel})</option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
    </Field>
  );
}

/** FR-15: chọn phong cách, rồi đổi riêng từng mục nếu muốn. */
export function StylePicker() {
  const templateType = useEditorStore((s) => s.doc.template_type);
  const stored = useEditorStore((s) => s.doc.web_config.style);
  const envelopeColor = useEditorStore((s) => s.doc.web_config.envelopeColor);
  const { setWebStyle, setWebConfig, endCoalesce } = useEditorStore.getState();
  // Thư không có style hiện đúng như trang người nhận: warm_letter.
  const style = stored ?? defaultWebStyle(templateType);
  const resolved = resolveWebStyle(stored);
  const theme = resolved.theme;
  const unreadable = Boolean(style.accent && !isReadableAccent(style.accent, theme.tokens.surface));

  const pickTheme = (id: WebThemeId) => setWebStyle({ ...NO_OVERRIDES, theme: id });

  return (
    <div className="space-y-6">
      <Section title="Phong cách">
        <div className="grid grid-cols-2 gap-2">
          {WEB_THEME_LIST.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={theme.id === item.id}
              onClick={() => pickTheme(item.id)}
              className="flex flex-col gap-1 rounded-xl border p-2.5 text-left aria-pressed:border-primary aria-pressed:ring-2 aria-pressed:ring-ring"
              style={{ backgroundColor: item.tokens.bg, color: item.tokens.ink }}
            >
              <span className="flex items-center justify-between gap-1 text-sm font-semibold">
                {item.label}
                <span
                  aria-hidden
                  className="size-3 shrink-0 rounded-full border border-black/15"
                  style={{ backgroundColor: item.tokens.accent }}
                />
              </span>
              <span className="line-clamp-2 text-[11px] opacity-80">{item.tagline}</span>
            </button>
          ))}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setWebStyle({ ...NO_OVERRIDES, ...randomWebStyle(style) })}
        >
          <Shuffle /> Gợi ý ngẫu nhiên
        </Button>
        {envelopeColor.toUpperCase() !== theme.suggestedEnvelopeColor.toUpperCase() && (
          // Chỉ gợi ý: không tự đổi màu phong bì người dùng đã chọn.
          <button
            type="button"
            onClick={() => setWebConfig({ envelopeColor: theme.suggestedEnvelopeColor })}
            className={cn("flex items-center gap-2 text-left text-xs text-primary underline")}
          >
            <span
              aria-hidden
              className="size-4 shrink-0 rounded-full border"
              style={{ backgroundColor: theme.suggestedEnvelopeColor }}
            />
            Dùng màu phong bì hợp với phong cách này (đổi cả bản in)
          </button>
        )}
      </Section>

      <Section title="Độ sôi động">
        <Choice
          options={EFFECT_CATALOG.intensity.map((o) => ({ value: o.id, label: o.label }))}
          value={resolved.intensity}
          onChange={(intensity) => setWebStyle({ intensity })}
        />
      </Section>

      <Section title="Hiệu ứng">
        {EFFECTS.map(({ key, label }) => (
          <EffectSelect<string>
            key={key}
            label={label}
            options={EFFECT_CATALOG[key] as EffectOption<string>[]}
            value={style[key]}
            fallback={theme.defaults[key]}
            onChange={(value) => setWebStyle({ [key]: value } as Partial<WebStyleConfig>)}
          />
        ))}
      </Section>

      <Section title="Màu nhấn & phông">
        <ColorField
          label="Màu nhấn"
          colors={ACCENTS}
          value={style.accent ?? theme.tokens.accent}
          onChange={(accent, custom) => setWebStyle({ accent }, custom ? "style-accent" : undefined)}
          onCommit={endCoalesce}
        />
        {unreadable && (
          <p role="alert" className="text-xs text-destructive">
            Màu này khó đọc trên nền của phong cách nên trang đang dùng màu mặc định.
          </p>
        )}
        {style.accent && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setWebStyle({ accent: undefined })}
          >
            Dùng màu của phong cách
          </Button>
        )}
        <Field label="Phông tiêu đề và chữ ký">
          <select
            className={inputClass}
            value={style.font ?? ""}
            onChange={(event) =>
              setWebStyle({ font: (event.target.value || undefined) as FontName | undefined })
            }
          >
            <option value="">Theo phong cách ({theme.fonts.heading})</option>
            {FONT_NAMES.map((name) => (
              <option key={name}>{name}</option>
            ))}
          </select>
        </Field>
      </Section>
    </div>
  );
}
