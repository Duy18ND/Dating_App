"use client";

import { Brush, Trash2 } from "lucide-react";
import { LetterView } from "@/components/letter/LetterView";
import { Button } from "@/components/ui/button";
import { useEditorStore } from "@/lib/editor/store";
import { BOARD_HEIGHTS, type BoardHeight, type BoardSection } from "@/types/letter";
import { Choice } from "../ui";

const SIZE_LABELS: Record<BoardHeight, string> = {
  880: "Banner ngang",
  1240: "Khung vừa",
  2200: "Khung đứng",
};
const SIZES = BOARD_HEIGHTS.map((height) => ({
  value: String(height),
  label: SIZE_LABELS[height],
}));

/** Cài đặt một khung tự do và nút mở màn thiết kế kiểu Canva. */
export function BoardFields({ section }: { section: BoardSection }) {
  const { updateWebSection, setBoard, setWebSections } = useEditorStore.getState();

  function changeHeight(next: BoardHeight) {
    if (next === section.height) return;
    // Giữ vật thể trong khung: dời theo tỷ lệ chiều cao, không đổi kích thước hay méo hình.
    const ratio = next / section.height;
    updateWebSection(section.id, {
      height: next,
      elements: section.elements.map((el) => ({ ...el, y: Math.round(el.y * ratio) })),
    });
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Kéo thả tự do như Canva: ảnh, sticker, icon, chữ, nét vẽ; phóng to, thu nhỏ, xoay. Ảnh ở
        đây tính vào 8 ảnh của trang web.
      </p>
      <Choice
        options={SIZES}
        value={String(section.height)}
        onChange={(value) => changeHeight(Number(value) as BoardHeight)}
      />
      <button
        type="button"
        onClick={() => setBoard(section.id)}
        aria-label="Mở màn thiết kế khung"
        className="block w-full overflow-hidden rounded-md border hover:border-primary"
      >
        <span className="pointer-events-none block">
          <LetterView face={section} height={section.height} qrUrl="" listening={false} />
        </span>
      </button>
      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={() => setBoard(section.id)}>
          <Brush /> Thiết kế khung
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="text-destructive"
          onClick={() => {
            if (!window.confirm("Xóa khung này cùng mọi thứ trong đó?")) return;
            const sections = useEditorStore.getState().doc.web_config.sections ?? [];
            setWebSections(sections.filter((s) => s.id !== section.id));
          }}
        >
          <Trash2 /> Xóa khung
        </Button>
      </div>
    </div>
  );
}
