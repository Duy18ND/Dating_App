import type { LetterPayload } from "@/types/letter";

export function samplePayload(): LetterPayload {
  return {
    template_type: "confession",
    title: "Thư gửi bạn",
    canvas_data: {
      width: 1240,
      height: 1754,
      defaultPrintSize: "A6",
      background: { type: "preset", value: "cream", overlayOpacity: 0 },
      elements: [
        { id: "t1", type: "text", x: 100, y: 100, rotation: 0, zIndex: 0, text: "Xin chào" },
        { id: "q1", type: "qr_code", x: 480, y: 1300, width: 280, height: 280, rotation: 0, zIndex: 1 },
      ],
    },
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
