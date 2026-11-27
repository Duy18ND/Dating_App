"use client";

import type Konva from "konva";
import type { ReactNode, Ref } from "react";
import { Layer, Stage } from "react-konva";
import { sortByLayer } from "@/lib/editor/store";
import { PRINT_CONFIG } from "@/lib/print-config";
import type { CardFace } from "@/types/letter";
import { BackgroundLayer } from "./BackgroundLayer";
import { ElementNode, type ElementHandlers } from "./ElementNode";
import { useFontsKey } from "./hooks";

const { width: W, height: H } = PRINT_CONFIG.CANVAS;

export interface LetterStageProps {
  /** Một mặt thiệp. Mọi mặt có cùng kích thước logic PRINT_CONFIG.CANVAS. */
  face: CardFace;
  /** Hệ số hiển thị. Tọa độ trong stage luôn là hệ logic PRINT_CONFIG.CANVAS. */
  scale: number;
  qrUrl: string;
  hideBackground?: boolean;
  hiddenElementId?: string | null;
  stageRef?: Ref<Konva.Stage>;
  onSelect?: (id: string | null) => void;
  onEdit?: (id: string) => void;
  onChange?: ElementHandlers["onChange"];
  /** Chặn chọn/kéo phần tử, ví dụ khi đang vẽ tay. */
  listening?: boolean;
  /** Layer bổ sung của editor: Transformer, khung lề an toàn. */
  children?: ReactNode;
}

/** Bộ vẽ lá thư dùng chung cho editor và trang người nhận. */
export default function LetterStage(props: LetterStageProps) {
  const { face, scale, qrUrl, stageRef, hideBackground, hiddenElementId, onSelect, onEdit } = props;
  const { onChange, listening = true, children } = props;
  const texts = face.elements.filter((el) => el.type === "text");
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
      <BackgroundLayer background={face.background} hidden={hideBackground} />
      <Layer name="content" listening={listening}>
        {sortByLayer(face.elements).map((element) => (
          <ElementNode
            key={element.id}
            element={element}
            qrUrl={qrUrl}
            fontsKey={fontsKey}
            hidden={element.id === hiddenElementId}
            onSelect={onSelect}
            onEdit={onEdit}
            onChange={onChange}
          />
        ))}
      </Layer>
      {children}
    </Stage>
  );
}
