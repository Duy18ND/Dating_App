"use client";

import { useCallback } from "react";
import { useEditorStore } from "@/lib/editor/store";
import { FONT_NAMES, type FontName } from "@/lib/font-names";
import { ICONS } from "@/lib/icons";
import { PRINT_CONFIG } from "@/lib/print-config";
import type { RenderOptions } from "@/lib/print/parts";
import { renderLetterSheet, renderWritingPage } from "@/lib/print/render-letter";
import { LIMITS } from "@/lib/validation";
import type { PaperStyle } from "@/types/letter";
import { ColorField } from "./ColorField";
import { PartPreview } from "./PartPreview";
import { TextInput } from "./TextInput";
import { INK_COLORS } from "./TextPanel";
import { Choice, Field, inputClass, Section } from "./ui";

const PAPER_COLORS = ["#FDFBF7", "#FFF5F5", "#FFF8E1", "#F0F7F0", "#EEF4FB", "#FFFFFF"];
const PAPERS: { value: PaperStyle; label: string }[] = [
  { value: "ruled", label: "Dòng kẻ" },
  { value: "dot_grid", label: "Chấm bi" },
  { value: "plain", label: "Giấy trơn" },
];
const { height, panelHeight } = PRINT_CONFIG.LETTER_MM;
const FOLDS = [panelHeight, panelHeight * 2].map((y) => `${(y / height) * 100}%`);

function LetterSheetSection() {
  const letter = useEditorStore((s) => s.doc.canvas_data.letter);
  const recipient = useEditorStore((s) => s.doc.web_config.recipientName);
  const setLetter = useEditorStore((s) => s.setLetter);
  const endCoalesce = useEditorStore((s) => s.endCoalesce);
  const render = useCallback(
    (options: RenderOptions) => renderLetterSheet({ letter, recipient }, options),
    [letter, recipient],
  );

  return (
    <Section title="Thư viết tay (gấp 3)">
      <p className="text-xs text-muted-foreground">
        In ra, viết cảm xúc của bạn bằng bút rồi gấp theo hai vạch. Phần giữa để trống cho bạn.
      </p>
      <TextInput
        label='Lời chào (để "Gửi" sẽ tự thêm tên người nhận)'
        value={letter.greeting}
        maxLength={LIMITS.maxLetterLine}
        onChange={(greeting) => setLetter({ greeting }, "letter-greeting")}
      />
      <TextInput
        label="Chữ ký (để trống nếu muốn ký bằng bút)"
        value={letter.signature}
        maxLength={LIMITS.maxLetterLine}
        onChange={(signature) => setLetter({ signature }, "letter-signature")}
      />
      <Choice options={PAPERS} value={letter.paper} onChange={(paper) => setLetter({ paper })} />
      <Field label="Phông chữ in sẵn">
        <select
          className={inputClass}
          value={letter.fontFamily}
          onChange={(event) => setLetter({ fontFamily: event.target.value as FontName })}
        >
          {FONT_NAMES.map((name) => (
            <option key={name}>{name}</option>
          ))}
        </select>
      </Field>
      <Field label="Hoa văn góc">
        <select
          className={inputClass}
          value={letter.decorIconId ?? ""}
          onChange={(event) => setLetter({ decorIconId: event.target.value || undefined })}
        >
          <option value="">Không có</option>
          {ICONS.map((icon) => (
            <option key={icon.id} value={icon.id}>
              {icon.label}
            </option>
          ))}
        </select>
      </Field>
      <ColorField
        label="Màu mực"
        colors={INK_COLORS.filter((color) => color !== "#FFFFFF")}
        value={letter.inkColor}
        onChange={(inkColor, custom) => setLetter({ inkColor }, custom ? "letter-ink" : undefined)}
        onCommit={endCoalesce}
      />
      <ColorField
        label="Màu giấy thư"
        colors={PAPER_COLORS}
        value={letter.paperColor}
        onChange={(paperColor, custom) =>
          setLetter({ paperColor }, custom ? "letter-paper" : undefined)
        }
        onCommit={endCoalesce}
      />
      <PartPreview part="letter" render={render} label="Xem trước thư gấp 3">
        {FOLDS.map((top) => (
          <div
            key={top}
            aria-hidden
            className="absolute inset-x-0 border-t border-dashed border-primary/50"
            style={{ top }}
          />
        ))}
      </PartPreview>
      <p className="text-xs text-muted-foreground">
        Đường đứt đỏ là vạch gấp, không in đè lên thư.
      </p>
    </Section>
  );
}

function WritingPageSection() {
  const page = useEditorStore((s) => s.doc.canvas_data.writingPage);
  const setPage = useEditorStore((s) => s.setWritingPage);
  const endCoalesce = useEditorStore((s) => s.endCoalesce);
  const render = useCallback((options: RenderOptions) => renderWritingPage(page, options), [page]);

  return (
    <Section title="Trang viết tay trong thiệp">
      <p className="text-xs text-muted-foreground">Nằm bên trái khi mở thiệp.</p>
      <Choice options={PAPERS} value={page.paper} onChange={(paper) => setPage({ paper })} />
      <ColorField
        label="Màu nền trang"
        colors={PAPER_COLORS}
        value={page.color}
        onChange={(color, custom) => setPage({ color }, custom ? "writing-color" : undefined)}
        onCommit={endCoalesce}
      />
      <PartPreview part="writingPage" render={render} label="Xem trước trang viết tay" />
    </Section>
  );
}

export function LetterPanel() {
  return (
    <div className="space-y-8">
      <LetterSheetSection />
      <WritingPageSection />
    </div>
  );
}
