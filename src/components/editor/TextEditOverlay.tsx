"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { fontFamilyOf } from "@/components/letter/hooks";
import { useEditorStore } from "@/lib/editor/store";
import { TEXT_DEFAULTS } from "@/lib/render/text";
import { LIMITS } from "@/lib/validation";

/**
 * Ô nhập chữ HTML đặt khớp tọa độ lên canvas khi nhấp đúp vào chữ.
 * Dùng textarea thật để bộ gõ tiếng Việt (Telex/VNI) hoạt động đúng.
 * Gắn qua prop `overlay` của LetterView, và truyền editingTextId vào `hiddenElementId`.
 */
export function TextEditOverlay({ scale }: { scale: number }) {
  const element = useEditorStore((s) =>
    s.doc.canvas_data.elements.find((el) => el.id === s.editingTextId && el.type === "text"),
  );
  const updateElement = useEditorStore((s) => s.updateElement);
  const setEditingText = useEditorStore((s) => s.setEditingText);
  const ref = useRef<HTMLTextAreaElement>(null);
  const id = element?.id;

  useEffect(() => {
    const area = ref.current;
    if (!id || !area) return;
    area.focus();
    area.setSelectionRange(area.value.length, area.value.length);
  }, [id]);

  // Chiều cao ô nhập bám theo nội dung.
  useLayoutEffect(() => {
    const area = ref.current;
    if (!area) return;
    area.style.height = "0";
    area.style.height = `${area.scrollHeight}px`;
  });

  if (!element) return null;
  // setEditingText cũng kết thúc bước Undo đang gộp.
  const close = () => setEditingText(null);

  return (
    <textarea
      ref={ref}
      aria-label="Nội dung chữ"
      value={element.text ?? ""}
      maxLength={LIMITS.maxTextLength}
      spellCheck={false}
      onChange={(event) =>
        updateElement(element.id, { text: event.target.value }, `text:${element.id}`)
      }
      onBlur={close}
      onKeyDown={(event) => {
        if (event.key === "Escape") close();
      }}
      className="absolute m-0 resize-none overflow-hidden border-0 bg-transparent p-0 outline-2 outline-primary outline-dashed"
      style={{
        left: element.x * scale,
        top: element.y * scale,
        width: (element.width ?? TEXT_DEFAULTS.width) * scale,
        fontFamily: fontFamilyOf(element.fontFamily),
        fontSize: (element.fontSize ?? TEXT_DEFAULTS.fontSize) * scale,
        lineHeight: TEXT_DEFAULTS.lineHeight,
        color: element.fill ?? TEXT_DEFAULTS.fill,
        textAlign: element.align ?? "left",
        transform: `rotate(${element.rotation}deg)`,
        transformOrigin: "0 0",
      }}
    />
  );
}
