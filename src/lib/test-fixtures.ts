import { blankCanvas } from "@/lib/editor/defaults";
import type { LetterPayload } from "@/types/letter";

export function samplePayload(): LetterPayload {
  const canvas = blankCanvas();
  canvas.faces.front.elements = [
    {
      id: "t1",
      type: "text",
      x: 100,
      y: 100,
      rotation: 0,
      zIndex: 0,
      text: "Xin chào",
      fontSize: 96,
    },
  ];
  canvas.faces.inside.elements = [
    { id: "q1", type: "qr_code", x: 1180, y: 400, width: 380, height: 380, rotation: 0, zIndex: 0 },
  ];
  return {
    template_type: "confession",
    title: "Thư gửi bạn",
    canvas_data: canvas,
    web_config: {
      recipientName: "Minh Anh",
      senderName: "Nam",
      envelopeColor: "#C8A882",
      waxSealColor: "#8E2424",
      audio: { enabled: false, trackId: "", startTime: 0, volume: 0.4 },
      blocks: { poll: { enabled: true, question: "Ăn gì?", options: ["Lẩu", "Nướng"] } },
    },
  };
}
