"use client";

import { AlignCenter, AlignLeft, AlignRight, Type } from "lucide-react";
import { fontFamilyOf } from "@/components/letter/hooks";
import { Button } from "@/components/ui/button";
import { currentElements, currentHeight, useEditorStore } from "@/lib/editor/store";
import { FONT_NAMES, type FontName } from "@/lib/font-names";
import { PRINT_CONFIG } from "@/lib/print-config";
import { TEXT_DEFAULTS } from "@/lib/render/text";
import { ColorField } from "./ColorField";
import { Field, inputClass, Section, Slider } from "./ui";

export const INK_COLORS = ["#2B2623", "#5A4636", "#8E2424", "#2F4A3A", "#243B5A", "#FFFFFF"];
const { width: CANVAS_W, safeMarginPx, minFontPx } = PRINT_CONFIG.CANVAS;
const MAX_WIDTH = CANVAS_W - safeMarginPx * 2;
const ALIGNS = [
  ["left", AlignLeft, "Căn trái"],
  ["center", AlignCenter, "Căn giữa"],
  ["right", AlignRight, "Căn phải"],
] as const;

/** Nút thêm khối chữ vào giữa vùng an toàn và mở ô nhập ngay. */
export function AddTextButton() {
  const addElement = useEditorStore((s) => s.addElement);
  const setEditingText = useEditorStore((s) => s.setEditingText);
  return (
    <Button
      type="button"
      variant="outline"
      onClick={() => {
        const width = TEXT_DEFAULTS.width;
        setEditingText(
          addElement({
            type: "text",
            x: (CANVAS_W - width) / 2,
            y: Math.round(
              (currentHeight(useEditorStore.getState()) -
                TEXT_DEFAULTS.fontSize * TEXT_DEFAULTS.lineHeight) /
                2,
            ),
            width,
            text: "Nhập lời nhắn của bạn",
            fontFamily: "Be Vietnam Pro",
            fontSize: TEXT_DEFAULTS.fontSize,
            fill: TEXT_DEFAULTS.fill,
            align: "center",
          }),
        );
      }}
    >
      <Type /> Thêm chữ
    </Button>
  );
}

/** Thanh thuộc tính: chỉ hiện khi đang chọn một khối chữ. */
export function TextPanel() {
  const element = useEditorStore((s) =>
    currentElements(s).find((el) => el.id === s.selectedId && el.type === "text"),
  );
  const update = useEditorStore((s) => s.updateElement);
  const endCoalesce = useEditorStore((s) => s.endCoalesce);
  const setEditingText = useEditorStore((s) => s.setEditingText);
  if (!element) return null;

  const key = (name: string) => `${name}:${element.id}`;
  const align = element.align ?? "left";

  return (
    <Section title="Chữ">
      <Button type="button" variant="outline" size="sm" onClick={() => setEditingText(element.id)}>
        Sửa nội dung
      </Button>

      <Field label="Phông chữ">
        <select
          className={inputClass}
          style={{ fontFamily: fontFamilyOf(element.fontFamily) }}
          value={element.fontFamily ?? "Be Vietnam Pro"}
          onChange={(event) => update(element.id, { fontFamily: event.target.value as FontName })}
        >
          {FONT_NAMES.map((name) => (
            <option key={name} value={name} style={{ fontFamily: fontFamilyOf(name) }}>
              {name}
            </option>
          ))}
        </select>
      </Field>

      <Slider
        label="Cỡ chữ"
        // Nhỏ hơn mức này in ra trên thiệp mini sẽ khó đọc.
        min={minFontPx}
        max={240}
        step={2}
        value={element.fontSize ?? TEXT_DEFAULTS.fontSize}
        format={(v) => `${v}px`}
        onChange={(fontSize) => update(element.id, { fontSize }, key("size"))}
        onCommit={endCoalesce}
      />
      <Slider
        label="Chiều rộng khung"
        min={200}
        max={MAX_WIDTH}
        step={4}
        value={element.width ?? TEXT_DEFAULTS.width}
        format={(v) => `${Math.round(v)}px`}
        onChange={(width) => update(element.id, { width }, key("width"))}
        onCommit={endCoalesce}
      />

      <div className="flex gap-2">
        {ALIGNS.map(([value, Icon, label]) => (
          <Button
            key={value}
            type="button"
            size="icon"
            variant={align === value ? "default" : "outline"}
            aria-label={label}
            aria-pressed={align === value}
            onClick={() => update(element.id, { align: value })}
          >
            <Icon />
          </Button>
        ))}
      </div>

      <ColorField
        label="Màu mực"
        colors={INK_COLORS}
        value={element.fill ?? TEXT_DEFAULTS.fill}
        onChange={(fill, custom) => update(element.id, { fill }, custom ? key("fill") : undefined)}
        onCommit={endCoalesce}
      />
    </Section>
  );
}
