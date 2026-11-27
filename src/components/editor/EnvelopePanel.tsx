"use client";

import { useCallback } from "react";
import { useEditorStore } from "@/lib/editor/store";
import { FONT_NAMES, type FontName } from "@/lib/font-names";
import { PRINT_CONFIG } from "@/lib/print-config";
import type { RenderOptions } from "@/lib/print/parts";
import { renderCardBack, renderEnvelopeFlap } from "@/lib/print/render-envelope";
import { LIMITS } from "@/lib/validation";
import { ColorField } from "./ColorField";
import { PartPreview } from "./PartPreview";
import { TextInput } from "./TextInput";
import { Field, inputClass, Section } from "./ui";

export const ENVELOPE_COLORS = ["#F2D7D5", "#F4E9DA", "#C8A882", "#E8B4BC", "#DDEBD8", "#8E2424"];

const { bodyWidth, bodyHeight, topFlap } = PRINT_CONFIG.ENVELOPE_C7_FLAT_MM;

/** Phong bì đã gấp, nhìn từ mặt có nắp. Nắp đầu bo tròn có trong bản PDF (T-29). */
function EnvelopePreview() {
  const decor = useEditorStore((s) => s.doc.canvas_data.envelope);
  const color = useEditorStore((s) => s.doc.web_config.envelopeColor);
  const render = useCallback(
    (options: RenderOptions) => renderEnvelopeFlap({ decor, color }, options),
    [decor, color],
  );

  return (
    <div
      className="relative w-full overflow-hidden rounded-md border shadow-sm"
      style={{ aspectRatio: `${bodyWidth} / ${bodyHeight}`, backgroundColor: color }}
    >
      <div
        className="absolute inset-x-0 top-0 drop-shadow-[0_2px_2px_rgba(0,0,0,0.18)]"
        style={{ height: `${(topFlap / bodyHeight) * 100}%` }}
      >
        <PartPreview
          part="envelopeFlap"
          render={render}
          label="Xem trước nắp phong bì"
          className="rounded-none border-0 [clip-path:polygon(0_0,100%_0,50%_100%)]"
        />
      </div>
    </div>
  );
}

function CardBackPreview() {
  const decor = useEditorStore((s) => s.doc.canvas_data.envelope);
  const frontBackground = useEditorStore((s) => s.doc.canvas_data.faces.front.background);
  const render = useCallback(
    (options: RenderOptions) => renderCardBack({ decor, frontBackground }, options),
    [decor, frontBackground],
  );
  return <PartPreview part="cardBack" render={render} label="Xem trước bìa sau thiệp" />;
}

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
        <EnvelopePreview />
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
          Màu này dùng cho cả phong bì in và phong bì trên trang web. Chữ lồng cũng in nhỏ ở bìa sau
          thiệp.
        </p>
      </Section>
      <Section title="Bìa sau thiệp">
        <CardBackPreview />
      </Section>
    </div>
  );
}
