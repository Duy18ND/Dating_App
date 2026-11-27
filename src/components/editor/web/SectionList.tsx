"use client";

import { ArrowDown, ArrowUp, ChevronDown, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEditorStore } from "@/lib/editor/store";
import { cn } from "@/lib/utils";
import { defaultWebSections } from "@/lib/web-defaults";
import { defaultWebStyle } from "@/lib/web-styles";
import {
  insertSection,
  isSectionEmpty,
  missingSectionTypes,
  newSection,
  SECTION_LABELS,
} from "@/lib/web-sections";
import { BlockSettings } from "../WebPanel";
import { SectionFields } from "./SectionFields";

/** FR-10: bật/tắt, đổi thứ tự bằng nút lên/xuống và ô nhập cho từng phần. */
export function SectionList({
  openId,
  onOpen,
}: {
  openId: string | null;
  onOpen: (id: string | null) => void;
}) {
  const sections = useEditorStore((s) => s.doc.web_config.sections);
  const blocks = useEditorStore((s) => s.doc.web_config.blocks);
  const hasBlocks = Boolean(
    blocks.acceptButton?.enabled || blocks.rsvp?.enabled || blocks.poll?.enabled,
  );
  const { moveWebSection, toggleWebSection, setWebSections } = useEditorStore.getState();

  if (!sections?.length) {
    return (
      <div className="space-y-6">
        <div className="space-y-3 rounded-lg border bg-accent p-3">
          <p className="text-sm">
            Thư này chưa có trang web cuộn: người nhận chỉ thấy tấm thiệp và các khối tương tác.
          </p>
          <Button
            type="button"
            onClick={() => {
              const { doc, setWebConfig } = useEditorStore.getState();
              setWebConfig({
                sections: defaultWebSections(doc.template_type),
                style: doc.web_config.style ?? defaultWebStyle(doc.template_type),
              });
            }}
          >
            <Plus /> Tạo trang web cuộn
          </Button>
        </div>
        <BlockSettings />
      </div>
    );
  }

  const missing = missingSectionTypes(sections);

  return (
    <div className="space-y-3">
      <ol className="space-y-2">
        {sections.map((section, index) => {
          const open = openId === section.id;
          const label = SECTION_LABELS[section.type];
          const hidden = section.enabled && isSectionEmpty(section, hasBlocks);
          return (
            <li key={section.id} className="rounded-lg border bg-card">
              <div className="flex items-center gap-1 p-1.5">
                <label className="flex size-10 shrink-0 cursor-pointer items-center justify-center">
                  <input
                    type="checkbox"
                    className="size-4 accent-primary"
                    checked={section.enabled}
                    aria-label={`Hiện phần ${label}`}
                    onChange={(event) => toggleWebSection(section.id, event.target.checked)}
                  />
                </label>
                <button
                  type="button"
                  aria-expanded={open}
                  onClick={() => onOpen(open ? null : section.id)}
                  className="flex min-w-0 flex-1 items-center gap-1 py-1.5 text-left"
                >
                  <ChevronDown
                    aria-hidden
                    className={cn("size-4 shrink-0 transition-transform", !open && "-rotate-90")}
                  />
                  <span className="min-w-0">
                    <span
                      className={cn(
                        "block truncate text-sm font-medium",
                        !section.enabled && "text-muted-foreground line-through",
                      )}
                    >
                      {label}
                    </span>
                    {hidden && (
                      <span className="block text-[11px] text-muted-foreground">
                        Đang trống nên sẽ tự ẩn
                      </span>
                    )}
                  </span>
                </button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`Đưa phần ${label} lên`}
                  disabled={index === 0}
                  onClick={() => moveWebSection(section.id, "up")}
                >
                  <ArrowUp />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`Đưa phần ${label} xuống`}
                  disabled={index === sections.length - 1}
                  onClick={() => moveWebSection(section.id, "down")}
                >
                  <ArrowDown />
                </Button>
              </div>
              {open && (
                <div className="space-y-3 border-t p-3">
                  <SectionFields section={section} />
                </div>
              )}
            </li>
          );
        })}
      </ol>
      {missing.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">Thêm phần</p>
          <div className="flex flex-wrap gap-2">
            {missing.map((type) => (
              <Button
                key={type}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const section = newSection(type);
                  const current = useEditorStore.getState().doc.web_config.sections ?? [];
                  setWebSections(insertSection(current, section));
                  onOpen(section.id);
                }}
              >
                <Plus /> {SECTION_LABELS[type]}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
