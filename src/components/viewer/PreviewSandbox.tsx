"use client";

import { Palette, RotateCcw, Shuffle, SlidersHorizontal, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { FONT_NAMES } from "@/lib/font-names";
import { TEMPLATES } from "@/lib/templates";
import { cn } from "@/lib/utils";
import {
  EFFECT_CATALOG,
  randomWebStyle,
  resolveWebStyle,
  WEB_THEME_LIST,
} from "@/lib/web-styles";
import type { PublicLetter, TemplateType, WebStyleConfig } from "@/types/letter";
import { LetterExperience } from "./LetterExperience";

function PillRow<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { id: T; label: string }[];
  value: T;
  onChange: (next: T) => void;
}) {
  return (
    <div className="space-y-1.5">
      <p className="font-semibold text-[#6E635A]">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            className={cn(
              "rounded-full border px-2.5 py-1 font-medium transition",
              value === opt.id
                ? "border-[#8E2424] bg-[#8E2424] text-white"
                : "border-[#E6DACB] bg-white text-[#2B2623] hover:bg-[#F3EADF]",
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Bảng xem thử phong cách & toàn bộ hiệu ứng đợt 1 không cần database (/xem-thu/[mau]). */
export function PreviewSandbox({
  letter,
  templateType,
  recipient,
}: {
  letter: PublicLetter;
  templateType: TemplateType;
  recipient: string;
}) {
  const [style, setStyle] = useState<WebStyleConfig>(
    letter.web_config.style ?? { theme: "warm_letter", intensity: "medium" },
  );
  const [openDrawer, setOpenDrawer] = useState(false);
  const [instanceKey, setInstanceKey] = useState(0);
  const resolved = resolveWebStyle(style);

  return (
    <div className="relative min-h-dvh">
      <LetterExperience
        key={instanceKey}
        letter={letter}
        recipient={recipient}
        preview
        styleOverride={style}
      />

      {/* Thanh nút nổi góc dưới trái */}
      <div className="fixed bottom-4 left-4 z-40 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setOpenDrawer((o) => !o)}
          aria-expanded={openDrawer}
          className="inline-flex items-center gap-2 rounded-full border border-black/15 bg-white/95 px-4 py-2.5 text-xs font-semibold text-[#2B2623] shadow-lg backdrop-blur hover:bg-white sm:text-sm"
        >
          <Palette className="size-4 text-[#8E2424]" />
          Phong cách & Hiệu ứng
        </button>
        <button
          type="button"
          onClick={() => setStyle((prev) => randomWebStyle(prev))}
          title="Gợi ý ngẫu nhiên phong cách và hiệu ứng"
          aria-label="Gợi ý ngẫu nhiên"
          className="inline-flex size-10 items-center justify-center rounded-full border border-black/15 bg-white/95 text-[#8E2424] shadow-lg backdrop-blur hover:bg-white"
        >
          <Shuffle className="size-4" />
        </button>
        <button
          type="button"
          onClick={() => setInstanceKey((k) => k + 1)}
          title="Đóng lại phong bì để xem lại hiệu ứng mở"
          aria-label="Đóng lại phong bì"
          className="inline-flex size-10 items-center justify-center rounded-full border border-black/15 bg-white/95 text-[#2B2623] shadow-lg backdrop-blur hover:bg-white"
        >
          <RotateCcw className="size-4" />
        </button>
      </div>

      {openDrawer && (
        <aside
          aria-label="Bảng đổi phong cách và hiệu ứng xem thử"
          className="fixed right-3 bottom-16 left-3 z-50 max-h-[78dvh] overflow-y-auto rounded-2xl border border-[#E6DACB] bg-[#FFFDF9]/98 p-4 text-[#2B2623] shadow-2xl backdrop-blur sm:right-auto sm:left-4 sm:w-[400px]"
        >
          <div className="mb-3 flex items-center justify-between border-b border-[#E6DACB] pb-2.5">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <SlidersHorizontal className="size-4 text-[#8E2424]" />
              Xem thử FR-15 (không lưu DB)
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setStyle((prev) => randomWebStyle(prev))}
                className="inline-flex items-center gap-1 rounded-full border border-[#8E2424]/30 bg-[#8E2424]/10 px-2.5 py-1 text-[11px] font-semibold text-[#8E2424] hover:bg-[#8E2424]/15"
              >
                <Shuffle className="size-3" /> Gợi ý ngẫu nhiên
              </button>
              <button
                type="button"
                onClick={() => setOpenDrawer(false)}
                aria-label="Đóng bảng xem thử"
                className="rounded-full p-1 hover:bg-black/5"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>

          <div className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <p className="font-semibold text-[#6E635A]">4 mẫu thư</p>
              <div className="grid grid-cols-2 gap-1.5">
                {TEMPLATES.map((tpl) => (
                  <Link
                    key={tpl.type}
                    href={`/xem-thu/${tpl.type}`}
                    className={cn(
                      "rounded-lg border px-2.5 py-1.5 text-center font-medium transition",
                      tpl.type === templateType
                        ? "border-[#8E2424] bg-[#8E2424] text-white"
                        : "border-[#E6DACB] bg-white hover:bg-[#F3EADF]",
                    )}
                  >
                    {tpl.name}
                  </Link>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <p className="font-semibold text-[#6E635A]">4 phong cách đợt 1</p>
              <div className="grid grid-cols-2 gap-2">
                {WEB_THEME_LIST.map((theme) => (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() =>
                      setStyle({ theme: theme.id, intensity: style.intensity })
                    }
                    className={cn(
                      "flex flex-col items-start gap-0.5 rounded-xl border p-2.5 text-left transition",
                      style.theme === theme.id
                        ? "border-[#8E2424] ring-2 ring-[#8E2424]/25"
                        : "border-[#E6DACB] hover:border-[#C8A882]",
                    )}
                    style={{ backgroundColor: theme.tokens.bg, color: theme.tokens.ink }}
                  >
                    <div className="flex w-full items-center justify-between gap-1">
                      <span className="font-semibold">{theme.label}</span>
                      <span
                        className="size-3 shrink-0 rounded-full border border-black/15"
                        style={{ backgroundColor: theme.tokens.accent }}
                      />
                    </div>
                    <span className="line-clamp-1 text-[10px] opacity-80">{theme.tagline}</span>
                  </button>
                ))}
              </div>
            </div>

            <PillRow
              label="Mở thư (bấm ↺ bên dưới để xem lại)"
              options={EFFECT_CATALOG.open}
              value={resolved.open}
              onChange={(open) => {
                setStyle((prev) => ({ ...prev, open }));
                setInstanceKey((k) => k + 1);
              }}
            />

            <PillRow
              label="Chữ xuất hiện"
              options={EFFECT_CATALOG.textReveal}
              value={resolved.textReveal}
              onChange={(textReveal) => setStyle((prev) => ({ ...prev, textReveal }))}
            />

            <PillRow
              label="Ảnh kỷ niệm"
              options={EFFECT_CATALOG.photo}
              value={resolved.photo}
              onChange={(photo) => setStyle((prev) => ({ ...prev, photo }))}
            />

            <PillRow
              label="Hiệu ứng hạt nền"
              options={EFFECT_CATALOG.particle}
              value={resolved.particle}
              onChange={(particle) => setStyle((prev) => ({ ...prev, particle }))}
            />

            <PillRow
              label="Con số"
              options={EFFECT_CATALOG.counter}
              value={resolved.counter}
              onChange={(counter) => setStyle((prev) => ({ ...prev, counter }))}
            />

            <PillRow
              label="Khi bấm Đồng ý"
              options={EFFECT_CATALOG.celebrate}
              value={resolved.celebrate}
              onChange={(celebrate) => setStyle((prev) => ({ ...prev, celebrate }))}
            />

            <PillRow
              label="Độ sôi động"
              options={EFFECT_CATALOG.intensity}
              value={resolved.intensity}
              onChange={(intensity) => setStyle((prev) => ({ ...prev, intensity }))}
            />

            <div className="space-y-1.5">
              <p className="font-semibold text-[#6E635A]">Phông tiêu đề</p>
              <div className="flex flex-wrap gap-1.5">
                {FONT_NAMES.map((font) => (
                  <button
                    key={font}
                    type="button"
                    onClick={() => setStyle((prev) => ({ ...prev, font }))}
                    className={cn(
                      "rounded-full border px-2.5 py-1 font-medium transition",
                      resolved.headingFont === font
                        ? "border-[#8E2424] bg-[#8E2424] text-white"
                        : "border-[#E6DACB] bg-white text-[#2B2623] hover:bg-[#F3EADF]",
                    )}
                  >
                    {font}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>
      )}
    </div>
  );
}
