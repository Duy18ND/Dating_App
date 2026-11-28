"use client";

import { ChevronDown, Shuffle, Sparkles } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useEditorStore } from "@/lib/editor/store";
import { FONT_NAMES, type FontName } from "@/lib/font-names";
import { cn } from "@/lib/utils";
import {
  cssFontVar,
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
import { Choice, Field, inputClass, Slider } from "../ui";

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
  garland: undefined,
};

const ACCENTS = ["#8E2424", "#B83B63", "#B83D24", "#2F4A3A", "#243B5A", "#E8C36B"];

function EffectChips<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: EffectOption<T>[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <Choice
        options={options.map((o) => ({ value: o.id, label: o.label }))}
        value={value}
        onChange={onChange}
      />
    </div>
  );
}

/** FR-15: giao diện chọn phong cách gọn gàng, trực quan bằng thẻ màu và chip bấm nhanh. */
export function StylePicker() {
  const templateType = useEditorStore((s) => s.doc.template_type);
  const stored = useEditorStore((s) => s.doc.web_config.style);
  const { setWebStyle, endCoalesce } = useEditorStore.getState();
  const [showAdvanced, setShowAdvanced] = useState(false);

  const style = stored ?? defaultWebStyle(templateType);
  const resolved = resolveWebStyle(stored);
  const theme = resolved.theme;
  const unreadable = Boolean(style.accent && !isReadableAccent(style.accent, theme.tokens.surface));

  const pickTheme = (id: WebThemeId) => setWebStyle({ ...NO_OVERRIDES, theme: id });

  return (
    <div className="space-y-4">
      {/* 1. Phong cách chủ đạo */}
      <section className="space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold">Phong cách</h3>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs text-primary"
            onClick={() => setWebStyle({ ...NO_OVERRIDES, ...randomWebStyle(style) })}
          >
            <Shuffle className="size-3.5" /> Ngẫu nhiên
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {WEB_THEME_LIST.map((item) => {
            const selected = theme.id === item.id;
            return (
              <button
                key={item.id}
                type="button"
                aria-pressed={selected}
                onClick={() => pickTheme(item.id)}
                className={cn(
                  "flex flex-col gap-1.5 rounded-xl border p-2.5 text-left transition",
                  selected
                    ? "border-primary ring-2 ring-primary/30"
                    : "hover:border-primary/50",
                )}
                style={{ backgroundColor: item.tokens.bg, color: item.tokens.ink }}
              >
                <span className="flex items-center justify-between gap-1 text-xs font-semibold">
                  <span className="truncate">{item.label}</span>
                  <span className="flex shrink-0 items-center gap-0.5">
                    <span
                      aria-hidden
                      className="size-2.5 rounded-full border border-black/15"
                      style={{ backgroundColor: item.tokens.accent }}
                    />
                    <span
                      aria-hidden
                      className="size-2.5 rounded-full border border-black/15"
                      style={{ backgroundColor: item.tokens.surface }}
                    />
                  </span>
                </span>
                <span className="line-clamp-1 text-[11px] opacity-75">{item.tagline}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* 2. Màu sắc & Chữ */}
      <section className="space-y-3 rounded-xl border bg-accent/25 p-3">
        <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Màu sắc & Chữ
        </h3>
        <ColorField
          label="Màu nhấn"
          colors={ACCENTS}
          value={style.accent ?? theme.tokens.accent}
          onChange={(accent, custom) => setWebStyle({ accent }, custom ? "style-accent" : undefined)}
          onCommit={endCoalesce}
        />
        {unreadable && (
          <p role="alert" className="text-xs text-destructive">
            Màu này hơi khó đọc trên nền hiện tại nên trang tạm dùng màu mặc định.
          </p>
        )}
        {style.accent && (
          <button
            type="button"
            onClick={() => setWebStyle({ accent: undefined })}
            className="text-xs font-medium text-primary underline underline-offset-4"
          >
            Khôi phục màu mặc định của phong cách
          </button>
        )}
        <Field label="Phông tiêu đề & chữ ký">
          <select
            className={inputClass}
            value={style.font ?? ""}
            onChange={(event) =>
              setWebStyle({ font: (event.target.value || undefined) as FontName | undefined })
            }
          >
            <option value="">Mặc định ({theme.fonts.heading})</option>
            {FONT_NAMES.map((name) => (
              <option key={name} style={{ fontFamily: cssFontVar(name) }}>
                {name}
              </option>
            ))}
          </select>
        </Field>
        <Slider
          label="Cỡ chữ trang web"
          min={0.85}
          max={1.35}
          step={0.05}
          value={resolved.textScale}
          format={(v) => `${Math.round(v * 100)}%`}
          onChange={(textScale) =>
            setWebStyle({ textScale: Math.round(textScale * 100) / 100 }, "style-text")
          }
          onCommit={endCoalesce}
        />
      </section>

      {/* 3. Hiệu ứng chính bằng chip bấm nhanh */}
      <section className="space-y-3 rounded-xl border bg-card p-3">
        <h3 className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          <Sparkles className="size-3.5 text-primary" /> Hiệu ứng & Trang trí
        </h3>
        <EffectChips
          label="Độ sôi động"
          options={EFFECT_CATALOG.intensity}
          value={resolved.intensity}
          onChange={(intensity) => setWebStyle({ intensity })}
        />
        <EffectChips
          label="Cách mở phong bì"
          options={EFFECT_CATALOG.open}
          value={resolved.open}
          onChange={(open) => setWebStyle({ open })}
        />
        <EffectChips
          label="Băng rôn đầu trang"
          options={EFFECT_CATALOG.garland}
          value={resolved.garland}
          onChange={(garland) => setWebStyle({ garland })}
        />
        <EffectChips
          label="Hiệu ứng nền"
          options={EFFECT_CATALOG.particle}
          value={resolved.particle}
          onChange={(particle) => setWebStyle({ particle })}
        />
        <EffectChips
          label="Khi bấm Đồng ý"
          options={EFFECT_CATALOG.celebrate}
          value={resolved.celebrate}
          onChange={(celebrate) => setWebStyle({ celebrate })}
        />
      </section>

      {/* 4. Hiệu ứng nâng cao (thu gọn mặc định cho gọn mắt) */}
      <div className="rounded-xl border bg-card">
        <button
          type="button"
          aria-expanded={showAdvanced}
          onClick={() => setShowAdvanced((v) => !v)}
          className="flex w-full items-center justify-between px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground hover:text-foreground"
        >
          <span>Tùy chỉnh hiệu ứng nâng cao</span>
          <ChevronDown
            aria-hidden
            className={cn("size-4 transition-transform", showAdvanced && "rotate-180")}
          />
        </button>
        {showAdvanced && (
          <div className="space-y-3 border-t p-3">
            <EffectChips
              label="Chữ xuất hiện"
              options={EFFECT_CATALOG.textReveal}
              value={resolved.textReveal}
              onChange={(textReveal) => setWebStyle({ textReveal })}
            />
            <EffectChips
              label="Ảnh kỷ niệm"
              options={EFFECT_CATALOG.photo}
              value={resolved.photo}
              onChange={(photo) => setWebStyle({ photo })}
            />
            <EffectChips
              label="Hiển thị con số"
              options={EFFECT_CATALOG.counter}
              value={resolved.counter}
              onChange={(counter) => setWebStyle({ counter })}
            />
          </div>
        )}
      </div>
    </div>
  );
}
