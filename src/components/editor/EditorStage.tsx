"use client";

import type Konva from "konva";
import { useEffect, useRef } from "react";
import { Layer, Line, Rect, Transformer } from "react-konva";
import type { NodeChange } from "@/components/letter/ElementNode";
import LetterStage from "@/components/letter/LetterStage";
import { useEditorStore } from "@/lib/editor/store";
import { normalizeAngle, pinchPatch, scalePatch } from "@/lib/editor/transform";
import { PRINT_CONFIG } from "@/lib/print-config";
import { LIMITS } from "@/lib/validation";
import type { CanvasElement } from "@/types/letter";

const { width: W, height: H, safeMarginPx: M } = PRINT_CONFIG.CANVAS;
const UI_COLOR = "#8E2424";
/** Mỗi nét tối đa chừng này số; dài hơn thì tự tách thành nét mới. */
const MAX_STROKE_NUMBERS = LIMITS.maxPointNumbers;
const MIN_POINT_GAP = 1.5;

const findById = (stage: Konva.Stage, id: string) =>
  stage.findOne((node: Konva.Node) => node.id() === id && node.name() === "element");

const isCoarse = () =>
  typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;

/** Lưu một nét: tọa độ điểm tương đối so với góc trên trái của nét. */
function commitStroke(points: number[]) {
  const { addElement, select, pen } = useEditorStore.getState();
  const xs = points.filter((_, i) => i % 2 === 0);
  const ys = points.filter((_, i) => i % 2 === 1);
  const x = Math.min(...xs);
  const y = Math.min(...ys);
  const relative = points.map((value, i) => Math.round(value - (i % 2 === 0 ? x : y)));
  // Chạm một cái thành một chấm.
  if (relative.length === 2) relative.push(relative[0] + 1, relative[1]);
  addElement({
    type: "handwriting",
    x: Math.round(x),
    y: Math.round(y),
    points: relative,
    fill: pen.color,
    strokeWidth: pen.width,
  });
  select(null);
}

/** Bút vẽ tay: vẽ nét tạm trực tiếp lên Konva (không qua React) để mượt trên điện thoại. */
function usePen(
  stageRef: React.RefObject<Konva.Stage | null>,
  liveRef: React.RefObject<Konva.Line | null>,
  active: boolean,
  color: string,
  width: number,
) {
  useEffect(() => {
    const stage = stageRef.current;
    const live = liveRef.current;
    if (!active || !stage || !live) return;
    let points: number[] | null = null;

    const position = () => stage.getRelativePointerPosition();
    const finish = () => {
      if (points && points.length >= 2) commitStroke(points);
      points = null;
      live.points([]);
      live.getLayer()?.batchDraw();
    };
    const down = (event: Konva.KonvaEventObject<PointerEvent>) => {
      if (!event.evt.isPrimary) return;
      const p = position();
      if (!p) return;
      points = [p.x, p.y];
      live.stroke(color);
      live.strokeWidth(width);
      live.points(points);
    };
    const move = (event: Konva.KonvaEventObject<PointerEvent>) => {
      if (!points || !event.evt.isPrimary) return;
      event.evt.preventDefault();
      const p = position();
      if (!p) return;
      const [lx, ly] = points.slice(-2);
      if (Math.hypot(p.x - lx, p.y - ly) < MIN_POINT_GAP) return;
      points.push(p.x, p.y);
      if (points.length >= MAX_STROKE_NUMBERS) {
        finish();
        points = [p.x, p.y];
      }
      live.points(points ?? []);
      live.getLayer()?.batchDraw();
    };

    stage.on("pointerdown.pen", down);
    stage.on("pointermove.pen", move);
    stage.on("pointerup.pen pointercancel.pen pointerleave.pen", finish);
    // Nhấc tay bên ngoài canvas thì stage không nhận được pointerup.
    window.addEventListener("pointerup", finish);
    return () => {
      stage.off(".pen");
      window.removeEventListener("pointerup", finish);
      finish();
    };
  }, [stageRef, liveRef, active, color, width]);
}

/** Thời điểm kết thúc cử chỉ 2 ngón gần nhất; Konva hay phát thêm một "tap" ngay sau đó. */
let lastPinchEnd = 0;

/** Hai ngón: phóng to/thu nhỏ và xoay phần tử đang chọn quanh tâm của nó. */
function usePinch(stageRef: React.RefObject<Konva.Stage | null>, active: boolean) {
  useEffect(() => {
    const stage = stageRef.current;
    if (!active || !stage) return;
    // Nghe sự kiện gốc trên khung canvas để không phụ thuộc cách Konva gộp touch/pointer.
    const container = stage.container();
    let gesture: {
      start: CanvasElement;
      box: { width: number; height: number };
      distance: number;
      angle: number;
    } | null = null;

    const measure = (touches: TouchList) => {
      const [a, b] = [touches[0], touches[1]];
      return {
        distance: Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY),
        angle: (Math.atan2(b.clientY - a.clientY, b.clientX - a.clientX) * 180) / Math.PI,
      };
    };

    const begin = (touches: TouchList) => {
      const { selectedId, editingTextId } = useEditorStore.getState();
      const node = selectedId ? findById(stage, selectedId) : undefined;
      if (!node || editingTextId) return;
      // Ngón thứ nhất đang kéo phần tử: dừng và tắt kéo, nếu không vị trí sẽ bị ghi đè.
      node.draggable(false);
      if (node.isDragging()) node.stopDrag();
      // Đọc lại sau stopDrag vì dragend vừa cập nhật vị trí.
      const element = useEditorStore
        .getState()
        .doc.canvas_data.elements.find((el) => el.id === selectedId);
      if (!element || element.locked) return;
      const rect = node.getClientRect({ skipTransform: true });
      gesture = {
        start: element,
        // Kích thước sao cho (width/2, height/2) đúng là tâm khung theo hệ trục của phần tử.
        box: { width: 2 * rect.x + rect.width, height: 2 * rect.y + rect.height },
        ...measure(touches),
      };
    };

    const start = (event: TouchEvent) => {
      if (event.touches.length === 2) begin(event.touches);
    };
    const move = (event: TouchEvent) => {
      if (event.touches.length !== 2) return;
      event.preventDefault();
      if (!gesture) begin(event.touches);
      if (!gesture || gesture.distance < 1) return;
      const now = measure(event.touches);
      useEditorStore
        .getState()
        .updateElement(
          gesture.start.id,
          pinchPatch(
            gesture.start,
            gesture.box,
            now.distance / gesture.distance,
            now.angle - gesture.angle,
          ),
          `pinch:${gesture.start.id}`,
        );
    };
    const end = (event: TouchEvent) => {
      if (event.touches.length >= 2 || !gesture) return;
      findById(stage, gesture.start.id)?.draggable(true);
      gesture = null;
      lastPinchEnd = Date.now();
      useEditorStore.getState().endCoalesce();
    };

    const options = { capture: true, passive: false };
    container.addEventListener("touchstart", start, options);
    container.addEventListener("touchmove", move, options);
    container.addEventListener("touchend", end, options);
    container.addEventListener("touchcancel", end, options);
    return () => {
      container.removeEventListener("touchstart", start, options);
      container.removeEventListener("touchmove", move, options);
      container.removeEventListener("touchend", end, options);
      container.removeEventListener("touchcancel", end, options);
    };
  }, [stageRef, active]);
}

/** Canvas của trình thiết kế. Chỉ chạy phía trình duyệt (import qua next/dynamic, ssr: false). */
export default function EditorStage({ scale }: { scale: number }) {
  const canvas = useEditorStore((s) => s.doc.canvas_data);
  const selectedId = useEditorStore((s) => s.selectedId);
  const editingTextId = useEditorStore((s) => s.editingTextId);
  const tool = useEditorStore((s) => s.tool);
  const pen = useEditorStore((s) => s.pen);
  const stageRef = useRef<Konva.Stage>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const liveRef = useRef<Konva.Line>(null);

  const selected = canvas.elements.find((el) => el.id === selectedId);
  const selecting = tool === "select";
  const coarse = isCoarse();

  // Gắn khung kéo giãn vào phần tử đang chọn, trừ khi đang gõ chữ hay đang vẽ.
  useEffect(() => {
    const stage = stageRef.current;
    const transformer = transformerRef.current;
    if (!stage || !transformer) return;
    const node = selected && selecting && !editingTextId ? findById(stage, selected.id) : null;
    transformer.nodes(node ? [node] : []);
    transformer.getLayer()?.batchDraw();
  }, [selected, selecting, editingTextId]);

  usePen(stageRef, liveRef, tool === "pen", pen.color, pen.width);
  usePinch(stageRef, selecting);

  function handleChange(id: string, change: NodeChange) {
    const { doc, updateElement } = useEditorStore.getState();
    const element = doc.canvas_data.elements.find((el) => el.id === id);
    if (!element) return;
    const position = { x: Math.round(change.x), y: Math.round(change.y) };
    if (change.scaleX === undefined || change.scaleY === undefined) {
      updateElement(id, position);
      return;
    }
    updateElement(id, {
      ...scalePatch(element, change.scaleX, change.scaleY),
      ...position,
      rotation: normalizeAngle(change.rotation ?? element.rotation),
    });
  }

  function handleSelect(id: string | null) {
    const state = useEditorStore.getState();
    if (state.tool === "eraser") {
      const element = state.doc.canvas_data.elements.find((el) => el.id === id);
      if (element?.type === "handwriting") state.removeElement(element.id);
      return;
    }
    // Nhấc ngón sau cử chỉ 2 ngón không được tính là chạm ra ngoài để bỏ chọn.
    if (id === null && Date.now() - lastPinchEnd < 500) return;
    if (state.tool === "select") state.select(id);
  }

  const locked = !!selected?.locked;
  const keepRatio = selected?.type === "text" || selected?.type === "qr_code";
  const anchors =
    selected?.type === "qr_code"
      ? ["top-left", "top-right", "bottom-left", "bottom-right"]
      : selected?.type === "text"
        ? ["top-left", "top-right", "bottom-left", "bottom-right", "middle-left", "middle-right"]
        : undefined;

  return (
    <LetterStage
      stageRef={stageRef}
      canvas={canvas}
      scale={scale}
      qrUrl={`${typeof window === "undefined" ? "" : window.location.origin}/l/xemthu`}
      hiddenElementId={editingTextId}
      listening={tool !== "pen"}
      onSelect={handleSelect}
      onEdit={(id) => selecting && useEditorStore.getState().setEditingText(id)}
      onChange={selecting ? handleChange : undefined}
    >
      <Layer name="editor-overlay" listening={false}>
        {/* Khung lề an toàn: chỉ có trên trình thiết kế, không bao giờ vào bản in. */}
        <Rect
          x={M}
          y={M}
          width={W - M * 2}
          height={H - M * 2}
          stroke={UI_COLOR}
          strokeWidth={2 / scale}
          dash={[12 / scale, 8 / scale]}
          opacity={0.45}
        />
        {canvas.defaultPrintSize === "A5" && (
          // Thiệp A5 gấp đôi ngang giữa để vừa phong bì C6.
          <Line
            points={[0, H / 2, W, H / 2]}
            stroke="#7A7067"
            strokeWidth={2 / scale}
            dash={[4 / scale, 6 / scale]}
            opacity={0.6}
          />
        )}
        <Line ref={liveRef} lineCap="round" lineJoin="round" tension={0.3} />
      </Layer>
      <Layer name="editor-transformer">
        <Transformer
          ref={transformerRef}
          keepRatio={keepRatio}
          enabledAnchors={anchors}
          resizeEnabled={!locked}
          rotateEnabled={!locked}
          flipEnabled={false}
          rotationSnaps={[0, 90, 180, 270]}
          rotationSnapTolerance={4}
          anchorSize={coarse ? 18 : 10}
          anchorCornerRadius={coarse ? 9 : 2}
          anchorStroke={UI_COLOR}
          borderStroke={UI_COLOR}
          borderDash={locked ? [6, 4] : undefined}
          rotateAnchorOffset={coarse ? 36 : 28}
          ignoreStroke
          boundBoxFunc={(oldBox, newBox) =>
            Math.abs(newBox.width) < 12 || Math.abs(newBox.height) < 12 ? oldBox : newBox
          }
        />
      </Layer>
    </LetterStage>
  );
}
