"use client";

import { useEditorStore } from "@/lib/editor/store";
import { FONT_NAMES, type FontName } from "@/lib/font-names";
import { LIMITS } from "@/lib/validation";
import { ColorField } from "./ColorField";
import { EnvelopeFront, FoldedEnvelope } from "./print/FoldedEnvelope";
import { TextInput } from "./TextInput";
import { Field, inputClass, Section, Toggle } from "./ui";

export const ENVELOPE_COLORS = ["#F2D7D5", "#F4E9DA", "#C8A882", "#E8B4BC", "#DDEBD8", "#8E2424"];

/** FR-12: chữ lồng tên, câu trên nắp phong bì và màu giấy dùng chung cho web và bản in. */
export function EnvelopePanel() {
  const decor = useEditorStore((s) => s.doc.canvas_data.envelope);
  const color = useEditorStore((s) => s.doc.web_config.envelopeColor);
  const recipient = useEditorStore((s) => s.doc.web_config.recipientName);
  const syncKit = useEditorStore((s) => s.syncKitBackground);
  const setSyncKit = useEditorStore((s) => s.setSyncKitBackground);
  const setEnvelope = useEditorStore((s) => s.setEnvelope);
  const setEnvelopeColor = useEditorStore((s) => s.setEnvelopeColor);
  const setWebConfig = useEditorStore((s) => s.setWebConfig);
  const endCoalesce = useEditorStore((s) => s.endCoalesce);

  return (
    <div className="space-y-6">
      <Section title="Mặt trước phong bì">
        <EnvelopeFront />
        <TextInput
          label='Chữ mặt trước (để "Gửi" sẽ tự thêm tên người nhận, xóa trống nếu muốn viết tay)'
          value={decor.frontText ?? "Gửi"}
          maxLength={LIMITS.maxEnvelopeFront}
          onChange={(frontText) => setEnvelope({ frontText }, "envelope-front")}
        />
        <TextInput
          label="Tên người nhận"
          value={recipient}
          maxLength={LIMITS.maxNameLength}
          onChange={(recipientName) => setWebConfig({ recipientName }, "recipient")}
        />
      </Section>
      <Section title="Mặt sau phong bì (nắp)">
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
          label={syncKit ? "Màu cả bộ (Phong bì + Thiệp)" : "Màu phong bì"}
          colors={ENVELOPE_COLORS}
          value={color}
          onChange={(envelopeColor, custom) =>
            setEnvelopeColor(envelopeColor, custom ? "envelope" : undefined)
          }
          onCommit={endCoalesce}
        />
        <Toggle
          label="Đồng bộ màu này cho cả Mặt trước & Mặt sau thiệp"
          checked={syncKit}
          onChange={setSyncKit}
        />
        <p className="text-xs text-muted-foreground">
          {syncKit
            ? "Chọn 1 lần ăn cả phong bì in, phong bì web và 2 mặt thiệp. Xem phôi trải phẳng ở mục “Xem cả bộ”."
            : "Đang chọn riêng màu phong bì (không đổi nền thiệp). Xem phôi trải phẳng ở mục “Xem cả bộ”."}
        </p>
      </Section>
    </div>
  );
}
