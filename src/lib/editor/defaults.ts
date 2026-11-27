import type { LetterPayload, TemplateType, WebConfig } from "@/types/letter";

export function defaultWebConfig(): WebConfig {
  return {
    recipientName: "",
    senderName: "",
    envelopeColor: "#C8A882",
    waxSealColor: "#8E2424",
    audio: { enabled: false, trackId: "", startTime: 0, volume: 0.4 },
    blocks: {},
  };
}

export function blankLetter(templateType: TemplateType = "confession"): LetterPayload {
  return {
    template_type: templateType,
    title: "",
    canvas_data: {
      width: 1240,
      height: 1754,
      defaultPrintSize: "A6",
      background: { type: "preset", value: "cream", overlayOpacity: 0 },
      elements: [],
    },
    web_config: defaultWebConfig(),
  };
}
