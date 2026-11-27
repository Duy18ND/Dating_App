"use client";

import type Konva from "konva";
import type { ReactNode, Ref } from "react";
import { Layer, Stage } from "react-konva";
import { sortByLayer } from "@/lib/editor/store";
import { PRINT_CONFIG } from "@/lib/print-config";
import type { CanvasData } from "@/types/letter";
import { BackgroundLayer } from "./BackgroundLayer";
import { ElementNode } from "./ElementNode";
import { useFontsKey } from "./hooks";

const { width: W, height: H } = PRINT_CONFIG.CANVAS;

export interface LetterStageProps {
  canvas: CanvasData;
  /** Hệ số hiển thị. Tọa độ trong stage luôn là hệ logic 1240 x 1754. */
  scale: number;
  qrUrl: string;
  hideBackground?: boolean;
  hiddenElementId?: string | null;
  stageRef?: Ref<Konva.Stage>;
  onSelect?: (id: string | null) => void;
  onEdit?: (id: string) => void;
  /** Layer bổ sung của editor: Transformer, khung lề an toàn, nếp gấp A5 (T-09). */
  children?: ReactNode;
}

/** Bộ vẽ lá thư dùng chung cho editor và trang người nhận. */
export default function LetterStage(props: LetterStageProps) {
  const { canvas, scale, qrUrl, stageRef, hideBackground, hiddenElementId, onSelect, onEdit, children } =
    props;
  const texts = canvas.elements.filter((el) => el.type === "text");
  const fontsKey = useFontsKey(
    texts.map((el) => el.fontFamily ?? "Be Vietnam Pro"),
    texts.map((el) => el.text).join(""),
  );

  return (
    <Stage
      ref={stageRef}
      width={W * scale}
      height={H * scale}
      scaleX={scale}
      scaleY={scale}
      onClick={(event) => event.target === event.target.getStage() && onSelect?.(null)}
      onTap={(event) => event.target === event.target.getStage() && onSelect?.(null)}
    >
      <BackgroundLayer background={canvas.background} hidden={hideBackground} />
      <Layer name="content">
        {sortByLayer(canvas.elements).map((element) => (
          <ElementNode
            key={element.id}
            element={element}
            qrUrl={qrUrl}
            fontsKey={fontsKey}
            hidden={element.id === hiddenElementId}
            onSelect={onSelect}
            onEdit={onEdit}
          />
        ))}
      </Layer>
      {children}
    </Stage>
  );
}
