"use client";

import { Eraser, MousePointer2, PenLine, Rows3, Grip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEditorStore, type Tool } from "@/lib/editor/store";
import { PRINT_CONFIG } from "@/lib/print-config";
import { LIMITS } from "@/lib/validation";
import { ColorField } from "./ColorField";
import { INK_COLORS } from "./TextPanel";
import { Section, Slider } from "./ui";

const { width: W, height: H, safeMarginPx: M } = PRINT_CONFIG.CANVAS;
const AREA_HEIGHT = 520;

const TOOLS: [Tool, typeof PenLine, string][] = [
  ["select", MousePointer2, "Chọn"],
  ["pen", PenLine, "Bút vẽ"],
  ["eraser", Eraser, "Tẩy nét"],
];

/** FR-05: vùng dòng kẻ để viết bút thật sau khi in, và bút vẽ tay trực tiếp. */
export function HandwritingPanel() {
  const tool = useEditorStore((s) => s.tool);
  const pen = useEditorStore((s) => s.pen);
  const setTool = useEditorStore((s) => s.setTool);
  const setPen = useEditorStore((s) => s.setPen);
  const addElement = useEditorStore((s) => s.addElement);
  const update = useEditorStore((s) => s.updateElement);
  const count = useEditorStore((s) => s.doc.canvas_data.elements.length);
  const strokes = useEditorStore(
    (s) => s.doc.canvas_data.elements.filter((el) => el.type === "handwriting").length,
  );
  const selectedArea = useEditorStore((s) =>
    s.doc.canvas_data.elements.find((el) => el.id === s.selectedId && el.type === "lined_area"),
  );
  const full = count >= LIMITS.maxElements;

  const addArea = (lineStyle: "ruled" | "dot_grid") => {
    setTool("select");
    addElement({
      type: "lined_area",
      lineStyle,
      x: M,
      y: Math.round((H - AREA_HEIGHT) / 2),
      width: W - M * 2,
      height: AREA_HEIGHT,
      fill: "#7A7067",
    });
  };

  return (
    <div className="space-y-6">
      <Section title="Vùng viết tay khi in">
        <p className="text-xs text-muted-foreground">In ra rồi viết bằng bút mực thật và ký tên.</p>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" disabled={full} onClick={() => addArea("ruled")}>
            <Rows3 /> Dòng kẻ
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={full}
            onClick={() => addArea("dot_grid")}
          >
            <Grip /> Chấm bi
          </Button>
        </div>
        {selectedArea && (
          <ColorField
            label="Màu dòng kẻ"
            colors={["#7A7067", "#C8A882", "#8E2424", "#243B5A"]}
            value={selectedArea.fill ?? "#7A7067"}
            onChange={(fill) => update(selectedArea.id, { fill })}
          />
        )}
      </Section>

      <Section title="Bút vẽ tay">
        <div className="flex gap-2" role="group" aria-label="Công cụ">
          {TOOLS.map(([value, Icon, label]) => (
            <Button
              key={value}
              type="button"
              size="sm"
              variant={tool === value ? "default" : "outline"}
              aria-pressed={tool === value}
              disabled={value === "pen" && full}
              onClick={() => setTool(value)}
            >
              <Icon /> {label}
            </Button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          {tool === "pen" && "Vẽ bằng chuột, ngón tay hoặc bút cảm ứng ngay trên thiệp."}
          {tool === "eraser" && "Chạm vào nét vẽ để xóa nét đó."}
          {tool === "select" && `Đang có ${strokes} nét vẽ.`}
        </p>
        <ColorField
          label="Màu mực"
          colors={INK_COLORS}
          value={pen.color}
          onChange={(color) => setPen({ color })}
        />
        <Slider
          label="Độ dày nét"
          min={2}
          max={8}
          step={1}
          value={pen.width}
          format={(v) => `${v}px`}
          onChange={(width) => setPen({ width })}
        />
        {full && (
          <p role="alert" className="text-sm text-destructive">
            Thiệp đã đạt tối đa {LIMITS.maxElements} thành phần. Hãy xóa bớt để vẽ tiếp.
          </p>
        )}
      </Section>
    </div>
  );
}
