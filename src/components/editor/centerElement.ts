import Konva from "konva";
import { currentElements, useEditorStore } from "@/lib/editor/store";

/**
 * Vị trí mới để khung của phần tử nằm giữa mặt thiệp theo một trục. Đo khung thật trên canvas
 * vì chữ và nét vẽ không lưu đủ kích thước, và vật đã xoay có khung bao khác x/y.
 */
export function centerOnCanvas(
  id: string,
  axis: "x" | "y",
  canvas: { width: number; height: number },
): { x?: number; y?: number } | null {
  const element = currentElements(useEditorStore.getState()).find((el) => el.id === id);
  for (const stage of Konva.stages) {
    const node = stage.findOne(
      (candidate: Konva.Node) => candidate.id() === id && candidate.name() === "element",
    );
    if (!node || !element) continue;
    const box = node.getClientRect({ relativeTo: stage, skipShadow: true, skipStroke: true });
    const size = axis === "x" ? box.width : box.height;
    const target = ((axis === "x" ? canvas.width : canvas.height) - size) / 2;
    return { [axis]: Math.round(element[axis] + target - box[axis]) };
  }
  return null;
}
