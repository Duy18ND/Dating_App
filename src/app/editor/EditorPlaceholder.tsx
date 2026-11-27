"use client";

import { useSearchParams } from "next/navigation";
import { TemplatePreview } from "@/components/home/TemplatePreview";
import { findTemplate, TEMPLATES } from "@/lib/templates";

export function EditorPlaceholder() {
  const query = useSearchParams();
  const template = findTemplate(query.get("template")) ?? TEMPLATES[0];
  if (query.has("edit")) {
    return <p className="mt-4">Chức năng chỉnh sửa thư đang được xây dựng.</p>;
  }
  return (
    <>
      <h1 className="mt-4 text-xl font-semibold">{template.name}</h1>
      <p className="mt-2 mb-4 text-sm text-muted-foreground">
        Trình thiết kế đang được xây dựng. Đây là bản xem trước của mẫu.
      </p>
      <TemplatePreview key={template.type} type={template.type} />
    </>
  );
}
