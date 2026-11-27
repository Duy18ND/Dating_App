import { PRINT_CONFIG } from "@/lib/print-config";
import type { CanvasData, CardFace, LetterPayload, TemplateType, WebConfig } from "@/types/letter";

export function defaultWebConfig(): WebConfig {
  return {
    recipientName: "",
    senderName: "",
    envelopeColor: "#F2D7D5",
    waxSealColor: "#8E2424",
    audio: { enabled: false, trackId: "", startTime: 0, volume: 0.4 },
    blocks: {},
  };
}

export const blankFace = (): CardFace => ({
  background: { type: "preset", value: "cream", overlayOpacity: 0 },
  elements: [],
});

export function blankCanvas(): CanvasData {
  return {
    version: 2,
    width: PRINT_CONFIG.CANVAS.width,
    height: PRINT_CONFIG.CANVAS.height,
    faces: { front: blankFace(), inside: blankFace() },
    writingPage: { paper: "ruled", color: "#FDFBF7" },
    letter: {
      paper: "ruled",
      greeting: "Gửi",
      signature: "",
      fontFamily: "Dancing Script",
      inkColor: "#2B2623",
      paperColor: "#FDFBF7",
    },
    envelope: { monogram: "", line: "", fontFamily: "Dancing Script" },
  };
}

export function blankLetter(templateType: TemplateType = "confession"): LetterPayload {
  return {
    template_type: templateType,
    title: "",
    canvas_data: blankCanvas(),
    web_config: defaultWebConfig(),
  };
}
