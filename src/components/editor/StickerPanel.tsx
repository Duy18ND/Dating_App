"use client";

import { useState } from "react";
import { currentElements, currentHeight, useEditorStore } from "@/lib/editor/store";
import { findIcon, ICON_CATEGORIES, ICON_VIEWBOX, ICONS, type LetterIcon } from "@/lib/icons";
import { PRINT_CONFIG } from "@/lib/print-config";
import { DEFAULT_STICKER_TAB, MEMES, STICKER_SIZE_PX, type StickerTab } from "@/lib/stickers";
import { ColorField } from "./ColorField";
import { Choice, Section } from "./ui";

const ICON_SIZE_PX = 200;
const ICON_COLORS = ["#8E2424", "#2B2623", "#C8A882", "#5F7A5A", "#243B5A", "#E0455E", "#FFFFFF"];
const TABS: { value: StickerTab; label: string }[] = [
  ...ICON_CATEGORIES.map(({ id, label }) => ({ value: id, label })),
  { value: "meme", label: "Meme & Tấu hài" },
];

const centeredBox = (width: number, height: number) => ({
  x: Math.round((PRINT_CONFIG.CANVAS.width - width) / 2),
  y: Math.round((currentHeight(useEditorStore.getState()) - height) / 2),
  width,
  height,
});

function IconPreview({ icon }: { icon: LetterIcon }) {
  return (
    <svg
      viewBox={`0 0 ${ICON_VIEWBOX} ${ICON_VIEWBOX}`}
      className="size-8"
      fill={icon.filled ? "currentColor" : "none"}
      stroke={icon.filled ? "none" : "currentColor"}
      strokeWidth={1.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d={icon.d} />
    </svg>
  );
}

/** 3 bộ icon SVG đổi màu và 1 bộ sticker meme. */
export function StickerPanel() {
  const template = useEditorStore((s) => s.doc.template_type);
  // null = người dùng chưa tự chọn, đi theo gợi ý của mẫu.
  const [chosen, setChosen] = useState<StickerTab | null>(null);
  const tab = chosen ?? DEFAULT_STICKER_TAB[template];
  const addElement = useEditorStore((s) => s.addElement);
  const update = useEditorStore((s) => s.updateElement);
  const endCoalesce = useEditorStore((s) => s.endCoalesce);
  const selected = useEditorStore((s) =>
    currentElements(s).find((el) => el.id === s.selectedId && el.type === "svg_icon"),
  );
  const selectedIcon = findIcon(selected?.iconId);

  return (
    <Section title="Icon & Sticker">
      <Choice options={TABS} value={tab} onChange={setChosen} />

      <div className="grid grid-cols-4 gap-2">
        {tab === "meme"
          ? MEMES.map((meme) => (
              <button
                key={meme.id}
                type="button"
                title={meme.label}
                onClick={() =>
                  addElement({
                    type: "sticker_img",
                    src: meme.src,
                    ...centeredBox(STICKER_SIZE_PX, STICKER_SIZE_PX),
                  })
                }
                className="rounded-md border bg-card p-1 hover:bg-accent"
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- ảnh tĩnh ~10KB */}
                <img
                  src={meme.src}
                  alt={meme.label}
                  loading="lazy"
                  className="aspect-square w-full"
                />
              </button>
            ))
          : ICONS.filter((icon) => icon.category === tab).map((icon) => (
              <button
                key={icon.id}
                type="button"
                title={icon.label}
                aria-label={icon.label}
                onClick={() => {
                  const w = icon.defaultSize?.width ?? ICON_SIZE_PX;
                  const h = icon.defaultSize?.height ?? ICON_SIZE_PX;
                  addElement({
                    type: "svg_icon",
                    iconId: icon.id,
                    fill: ICON_COLORS[0],
                    ...centeredBox(w, h),
                  });
                }}
                className="flex aspect-square items-center justify-center rounded-md border bg-card text-primary hover:bg-accent"
              >
                <IconPreview icon={icon} />
              </button>
            ))}
      </div>

      {selected && selectedIcon && (
        <ColorField
          label={`Màu icon "${selectedIcon.label}"`}
          colors={ICON_COLORS}
          value={selected.fill ?? ICON_COLORS[0]}
          onChange={(fill, custom) =>
            update(selected.id, { fill }, custom ? `icon-color:${selected.id}` : undefined)
          }
          onCommit={endCoalesce}
        />
      )}
    </Section>
  );
}
