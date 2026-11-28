"use client";

import { useEditorStore } from "@/lib/editor/store";
import { FONT_NAMES, type FontName } from "@/lib/font-names";
import { LIMITS } from "@/lib/validation";
import { ColorField } from "./ColorField";
import { EnvelopeFront, FoldedEnvelope } from "./print/FoldedEnvelope";
import { TextInput } from "./TextInput";
import { Field, inputClass, Section, Toggle } from "./ui";

export const ENVELOPE_COLORS = ["#F2D7D5", "#F4E9DA", "#C8A882", "#E8B4BC", "#DDEBD8", "#8E2424"];
const SEAL_COLORS = ["#8E2424", "#C9A227", "#2B2623", "#2F4A3A", "#243B5A", "#B0566B"];

/** FR-12: người nhận/người gửi, chữ lồng tên, câu trên nắp, dấu sáp và màu giấy dùng chung cho web & bản in. */
export function EnvelopePanel() {
  const decor = useEditorStore((s) => s.doc.canvas_data.envelope);
  const color = useEditorStore((s) => s.doc.web_config.envelopeColor);
  const sealColor = useEditorStore((s) => s.doc.web_config.waxSealColor);
  const recipient = useEditorStore((s) => s.doc.web_config.recipientName);
  const sender = useEditorStore((s) => s.doc.web_config.senderName);
  const syncKit = useEditorStore((s) => s.syncKitBackground);
  const setSyncKit = useEditorStore((s) => s.setSyncKitBackground);
  const setEnvelope = useEditorStore((s) => s.setEnvelope);
  const setEnvelopeColor = useEditorStore((s) => s.setEnvelopeColor);
  const setWebConfig = useEditorStore((s) => s.setWebConfig);
  const endCoalesce = useEditorStore((s) => s.endCoalesce);

  return (
    <div className="space-y-6">
      <Section title="Người gửi & Người nhận">
        <EnvelopeFront />
        <TextInput
          label="Tên người nhận"
          placeholder="VD: Minh Anh"
          value={recipient}
          maxLength={LIMITS.maxNameLength}
          onChange={(recipientName) => setWebConfig({ recipientName }, "recipient")}
        />
        <TextInput
          label="Tên người gửi"
          placeholder="VD: Duy"
          value={sender}
          maxLength={LIMITS.maxNameLength}
          onChange={(senderName) => setWebConfig({ senderName }, "sender")}
        />
        <TextInput
          label='Chữ mặt trước (để "Gửi" sẽ tự nối tên người nhận)'
          value={decor.frontText ?? "Gửi"}
          maxLength={LIMITS.maxEnvelopeFront}
          onChange={(frontText) => setEnvelope({ frontText }, "envelope-front")}
        />
      </Section>
      <Section title="Mặt sau phong bì & Màu sắc">
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
        <ColorField
          label="Màu dấu sáp niêm phong"
          colors={SEAL_COLORS}
          value={sealColor}
          onChange={(waxSealColor, custom) =>
            setWebConfig({ waxSealColor }, custom ? "seal" : undefined)
          }
          onCommit={endCoalesce}
        />
        <Toggle
          label="Đồng bộ màu phong bì cho cả Mặt trước & Mặt sau thiệp"
          checked={syncKit}
          onChange={setSyncKit}
        />
      </Section>
    </div>
  );
}
