"use client";

import Konva from "konva";
import { useCallback, useEffect, useRef } from "react";
import { computeSnap, snapResizePoint, type Box, type Guide, type SnapSpace } from "@/lib/editor/snap";
import { PRINT_CONFIG } from "@/lib/print-config";

const { width, height, safeMarginPx } = PRINT_CONFIG.CANVAS;
const SPACE: SnapSpace = { width, height, margin: safeMarginPx };
/** Khoảng hút tính theo điểm ảnh trên màn hình, để cảm giác như nhau ở mọi mức thu phóng. */
const SNAP_SCREEN_PX = 7;
const GUIDE_COLOR = "#E0367C";

const rectOf = (node: Konva.Node): Box =>
  node.getClientRect({
    relativeTo: node.getStage() ?? undefined,
    skipShadow: true,
    skipStroke: true,
  });

const otherBoxes = (stage: Konva.Stage, except: Konva.Node) =>
  stage
    .find((node: Konva.Node) => node.name() === "element" && node !== except && node.visible())
    .map(rectOf);

/**
 * Đường gióng kiểu Canva khi kéo và kéo giãn. Vẽ thẳng bằng Konva (không qua React) cho mượt.
 * Giữ Ctrl (Cmd trên Mac) để tạm tắt hút.
 */
export function useSnapping(
  stageRef: React.RefObject<Konva.Stage | null>,
  guideRef: React.RefObject<Konva.Group | null>,
  transformerRef: React.RefObject<Konva.Transformer | null>,
  scale: number,
) {
  /** Khung lúc bắt đầu kéo giãn, để giữ tỷ lệ khi hút nút góc. */
  const resizeStart = useRef<Box | null>(null);

  const draw = useCallback(
    (guides: Guide[]) => {
      const group = guideRef.current;
      if (!group) return;
      group.destroyChildren();
      for (const guide of guides) {
        const gap = guide.kind === "gap";
        group.add(
          new Konva.Line({
            points: [guide.x1, guide.y1, guide.x2, guide.y2],
            stroke: GUIDE_COLOR,
            strokeWidth: (gap ? 2 : 1) / scale,
            dash: gap ? undefined : [6 / scale, 4 / scale],
          }),
        );
        if (!gap) continue;
        // Vạch chặn hai đầu cho đoạn đánh dấu khoảng cách bằng nhau.
        const vertical = guide.x1 === guide.x2;
        const half = 6 / scale;
        for (const [x, y] of [
          [guide.x1, guide.y1],
          [guide.x2, guide.y2],
        ]) {
          group.add(
            new Konva.Line({
              points: vertical ? [x - half, y, x + half, y] : [x, y - half, x, y + half],
              stroke: GUIDE_COLOR,
              strokeWidth: 2 / scale,
            }),
          );
        }
      }
      group.getLayer()?.batchDraw();
    },
    [guideRef, scale],
  );

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || scale <= 0) return;
    const clear = () => {
      resizeStart.current = null;
      draw([]);
    };
    stage.on("dragmove.snap", (event: Konva.KonvaEventObject<DragEvent>) => {
      const node = event.target;
      if (node.name() !== "element") return;
      if (event.evt?.ctrlKey || event.evt?.metaKey) return draw([]);
      const result = computeSnap(
        rectOf(node),
        otherBoxes(stage, node),
        SPACE,
        SNAP_SCREEN_PX / scale,
      );
      node.position({ x: node.x() + result.dx, y: node.y() + result.dy });
      draw(result.guides);
    });
    stage.on("dragend.snap transformend.snap", clear);
    return () => {
      stage.off(".snap");
      clear();
    };
  }, [stageRef, draw, scale]);

  /** Cho Transformer: vị trí nút kéo giãn tính theo điểm ảnh màn hình. */
  return useCallback(
    (_old: { x: number; y: number }, next: { x: number; y: number }, event?: MouseEvent | TouchEvent) => {
      const stage = stageRef.current;
      const transformer = transformerRef.current;
      const node = transformer?.nodes()[0];
      const handle = transformer?.getActiveAnchor();
      const bypass = event && "ctrlKey" in event && (event.ctrlKey || event.metaKey);
      // Vật đang xoay thì các cạnh không song song với đường gióng: không hút.
      if (!stage || !transformer || !node || !handle || handle === "rotater" || bypass) return next;
      if (Math.abs(node.rotation() % 360) > 0.01) return next;
      resizeStart.current ??= rectOf(node);
      const origin = stage.getAbsolutePosition();
      const result = snapResizePoint(
        { x: (next.x - origin.x) / scale, y: (next.y - origin.y) / scale },
        handle,
        resizeStart.current,
        transformer.keepRatio(),
        otherBoxes(stage, node),
        SPACE,
        SNAP_SCREEN_PX / scale,
      );
      draw(result.guides);
      return { x: result.x * scale + origin.x, y: result.y * scale + origin.y };
    },
    [stageRef, transformerRef, draw, scale],
  );
}
