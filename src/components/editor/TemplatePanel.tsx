"use client";

import { useEditorStore } from "@/lib/editor/store";
import { createFromTemplate, TEMPLATES } from "@/lib/templates";
import { cn } from "@/lib/utils";
import { Choice, Section } from "./ui";

function PrintSize() {
  const size = useEditorStore((s) => s.doc.canvas_data.defaultPrintSize);
  return (
    <Section title="Khổ in">
      <Choice
        options={[
          { value: "A6", label: "Thiệp A6 (105 x 148 mm)" },
          { value: "A5", label: "A5 gấp đôi (148 x 210 mm)" },
        ]}
        value={size}
        onChange={useEditorStore.getState().setPrintSize}
      />
      <p className="text-xs text-muted-foreground">
        A5 dành cho thư dài, gấp đôi theo vạch giữa vẫn vừa phong bì C6.
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
