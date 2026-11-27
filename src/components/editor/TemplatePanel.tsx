"use client";

import { useEditorStore } from "@/lib/editor/store";
import { createFromTemplate, TEMPLATES } from "@/lib/templates";
import { cn } from "@/lib/utils";
import { Section } from "./ui";

function PrintSize() {
  return (
    <Section title="Bộ in mini">
      <p className="text-sm text-muted-foreground">
        Cả bộ in trên 1 tờ A4: phong bì 11,4 x 8,1 cm và tấm thiệp 10,5 x 7,4 cm. Trang “Lời mời +
        QR” được in; mặt sau thiệp để trắng cho bạn viết tay. Bìa trước hiện trên trang web.
      </p>
    </Section>
  );
}

/** Đổi sang mẫu khác. Thư đã xuất bản thì giữ loại mẫu để không lệch dữ liệu đang dùng. */
export function TemplatePanel() {
  const current = useEditorStore((s) => s.doc.template_type);
  const published = useEditorStore((s) => s.published);
  const dirty = useEditorStore((s) => s.doc !== s.savedDoc);

  if (published) {
    return (
      <div className="space-y-6">
        <PrintSize />
        <Section title="Mẫu thư">
          <p className="text-sm text-muted-foreground">
            Thư đã xuất bản nên không đổi mẫu được. Bạn vẫn sửa được mọi thứ trên thiệp.
          </p>
        </Section>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PrintSize />
      <Section title="Mẫu thư">
        <ul className="space-y-2">
          {TEMPLATES.map((template) => (
            <li key={template.type}>
              <button
                type="button"
                aria-pressed={current === template.type}
                onClick={() => {
                  if (dirty && !window.confirm("Đổi mẫu sẽ bỏ những gì bạn vừa sửa. Tiếp tục?")) {
                    return;
                  }
                  useEditorStore.getState().load(createFromTemplate(template.type));
                }}
                className={cn(
                  "w-full rounded-md border bg-card p-3 text-left hover:bg-accent",
                  current === template.type && "border-primary",
                )}
              >
                <span className="block text-sm font-medium">{template.name}</span>
                <span className="block text-xs text-muted-foreground">{template.description}</span>
              </button>
            </li>
          ))}
        </ul>
      </Section>
    </div>
  );
}
