"use client";

import { useEditorStore } from "@/lib/editor/store";
import { FONT_NAMES, type FontName } from "@/lib/font-names";
import { LIMITS } from "@/lib/validation";
import { ColorField } from "./ColorField";
import { FoldedEnvelope } from "./print/FoldedEnvelope";
import { TextInput } from "./TextInput";
import { Field, inputClass, Section } from "./ui";

export const ENVELOPE_COLORS = ["#F2D7D5", "#F4E9DA", "#C8A882", "#E8B4BC", "#DDEBD8", "#8E2424"];

/** FR-12: chữ lồng tên, câu trên nắp phong bì và màu giấy dùng chung cho web và bản in. */
export function EnvelopePanel() {
  const decor = useEditorStore((s) => s.doc.canvas_data.envelope);
  const color = useEditorStore((s) => s.doc.web_config.envelopeColor);
  const setEnvelope = useEditorStore((s) => s.setEnvelope);
  const setWebConfig = useEditorStore((s) => s.setWebConfig);
  const endCoalesce = useEditorStore((s) => s.endCoalesce);

  return (
    <div className="space-y-6">
      <Section title="Phong bì">
        <FoldedEnvelope />
        <TextInput
          label="Chữ lồng tên, ví dụ: u ♡"
          value={decor.monogram}
          maxLength={LIMITS.maxMonogram}
          onChange={(monogram) => setEnvelope({ monogram }, "envelope-monogram")}
        />
        <TextInput
          label="Một câu ngắn trên nắp phong bì"
          value={decor.line}
          maxLength={LIMITS.maxEnvelopeLine}
          onChange={(line) => setEnvelope({ line }, "envelope-line")}
        />
        <Field label="Phông chữ">
          <select
            className={inputClass}
            value={decor.fontFamily}
            onChange={(event) => setEnvelope({ fontFamily: event.target.value as FontName })}
          >
            {FONT_NAMES.map((name) => (
              <option key={name}>{name}</option>
            ))}
          </select>
        </Field>
        <ColorField
          label="Màu phong bì"
          colors={ENVELOPE_COLORS}
          value={color}
          onChange={(envelopeColor, custom) =>
            setWebConfig({ envelopeColor }, custom ? "envelope" : undefined)
          }
          onCommit={endCoalesce}
        />
        <p className="text-xs text-muted-foreground">
          Màu này dùng cho cả phong bì in và phong bì trên trang web. Xem phôi trải phẳng ở mục “Xem
          cả bộ”.
        </p>
      </Section>
    </div>
  );
}
