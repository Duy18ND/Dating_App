"use client";

import { ChevronDown, GripVertical, Plus } from "lucide-react";
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
import { useDragReorder } from "./useDragReorder";

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
    blocks.acceptButton?.enabled ||
      blocks.rsvp?.enabled ||
      blocks.poll?.enabled ||
      blocks.reply?.enabled,
  );
  const { reorderWebSections, toggleWebSection, setWebSections } = useEditorStore.getState();
  const { list, drag, handleProps, markerFor } = useDragReorder(
    sections?.length ?? 0,
    reorderWebSections,
  );

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

  const missing = missingSectionTypes(sections).filter((type) => type !== "board");

  return (
    <div className="space-y-3">
      <p className="text-[11px] text-muted-foreground">
        Tích để bật/tắt mục · kéo ⠿ để sắp xếp thứ tự.
      </p>
      <ol ref={list} className="space-y-1.5">
        {sections.map((section, index) => {
          const open = openId === section.id;
          const label = SECTION_LABELS[section.type];
          const hidden = section.enabled && isSectionEmpty(section, hasBlocks);
          return (
            <li
              key={section.id}
              className={cn(
                "relative rounded-lg border transition-colors",
                section.enabled ? "bg-card" : "bg-muted/40 opacity-75",
                drag?.from === index && "z-10 border-primary opacity-95 shadow-lg",
                markerFor(index) === "before" &&
                  "before:absolute before:inset-x-0 before:-top-1 before:h-1 before:rounded before:bg-primary",
                markerFor(index) === "after" &&
                  "after:absolute after:inset-x-0 after:-bottom-1 after:h-1 after:rounded before:bg-primary",
              )}
              style={drag?.from === index ? { transform: `translateY(${drag.offset}px)` } : undefined}
            >
              <div className="flex items-center gap-0.5 p-1">
                <label className="flex size-8 shrink-0 cursor-pointer items-center justify-center">
                  <input
                    type="checkbox"
                    className="size-4 accent-primary"
                    checked={section.enabled}
                    aria-label={`Hiện phần ${label}`}
                    onChange={(event) => {
                      toggleWebSection(section.id, event.target.checked);
                      if (event.target.checked) onOpen(section.id);
                    }}
                  />
                </label>
                <button
                  type="button"
                  aria-expanded={open}
                  onClick={() => onOpen(open ? null : section.id)}
                  className="flex min-w-0 flex-1 items-center gap-1.5 py-1.5 text-left"
                >
                  <ChevronDown
                    aria-hidden
                    className={cn("size-3.5 shrink-0 text-muted-foreground transition-transform", !open && "-rotate-90")}
                  />
                  <span className="min-w-0">
                    <span
                      className={cn(
                        "block truncate text-sm font-medium",
                        !section.enabled && "text-muted-foreground",
                      )}
                    >
                      {label}
                    </span>
                    {hidden && (
                      <span className="block text-[11px] text-muted-foreground">
                        Chưa nhập nội dung
                      </span>
                    )}
                  </span>
                </button>
                <button
                  type="button"
                  aria-label={`Kéo để đổi chỗ phần ${label}, hoặc bấm mũi tên lên xuống`}
                  className="flex size-8 shrink-0 cursor-grab touch-none items-center justify-center rounded-md text-muted-foreground select-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring active:cursor-grabbing"
                  {...handleProps(index)}
                >
                  <GripVertical aria-hidden className="size-4" />
                </button>
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
        <div className="space-y-1.5 pt-1">
          <p className="text-xs font-medium text-muted-foreground">Thêm mục khác</p>
          <div className="flex flex-wrap gap-1.5">
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
