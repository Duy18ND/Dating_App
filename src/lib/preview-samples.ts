import { createFromTemplate } from "@/lib/templates";
import { defaultWebSections } from "@/lib/web-defaults";
import { defaultWebStyle } from "@/lib/web-styles";
import type { PublicLetter, TemplateType } from "@/types/letter";

const ALIASES: Record<string, TemplateType> = {
  confession: "confession",
  "to-tinh": "confession",
  wedding: "wedding",
  "moi-cuoi": "wedding",
  dinner: "dinner",
  "moi-an": "dinner",
  holiday: "holiday",
  "sinh-nhat": "holiday",
};

const PREVIEW_EXPIRES_AT = "2099-12-31T00:00:00.000Z";

export function resolvePreviewTemplate(slug: string): TemplateType | null {
  return ALIASES[slug.toLowerCase()] ?? null;
}

/** Dữ liệu mẫu chạy hoàn toàn trên bộ nhớ cho /xem-thu/[mau], dùng đúng nội dung T-35. */
export function buildPreviewLetter(type: TemplateType): PublicLetter {
  const payload = createFromTemplate(type);
  return {
    ...payload,
    slug: `xemthu-${type}`,
    // Hằng số: Cache Components cấm Date.now() khi prerender. Bản xem thử không hiện hạn xóa.
    expires_at: PREVIEW_EXPIRES_AT,
    web_config: {
      ...payload.web_config,
      recipientName: type === "wedding" ? "Bạn thân mến" : "Minh Anh",
      senderName: type === "wedding" ? "Cô dâu & Chú rể" : "Người gửi bí mật",
      style: defaultWebStyle(type),
      sections: defaultWebSections(type, "preview"),
    },
  };
}
