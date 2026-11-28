"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { AudioPanel } from "../AudioPanel";
import { WebProblems } from "../WebPanel";
import { SectionList } from "./SectionList";
import { StylePicker } from "./StylePicker";
import { WebPreview } from "./WebPreview";

const TABS = [
  { id: "content", label: "Nội dung" },
  { id: "style", label: "Phong cách" },
  { id: "letter", label: "Nhạc nền" },
] as const;
type TabId = (typeof TABS)[number]["id"];

function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly { id: T; label: string }[];
  value: T;
  onChange: (id: T) => void;
}) {
  return (
    <div role="group" aria-label={label} className="flex shrink-0 gap-1 border-b bg-card p-1.5">
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          aria-pressed={value === option.id}
          onClick={() => onChange(option.id)}
          className="flex-1 rounded-md px-2 py-2 text-sm hover:bg-accent aria-pressed:bg-accent aria-pressed:font-medium aria-pressed:text-primary"
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

const PANES = [
  { id: "edit", label: "Soạn" },
  { id: "preview", label: "Xem trước" },
] as const;

/** Tab "Trang web": PC đặt ô nhập cạnh khung xem trước; điện thoại chuyển qua lại hai khung. */
export function WebEditor({ desktop }: { desktop: boolean }) {
  const [tab, setTab] = useState<TabId>("content");
  const [openId, setOpenId] = useState<string | null>(null);
  const [pane, setPane] = useState<(typeof PANES)[number]["id"]>("edit");
  const showForm = desktop || pane === "edit";
  const showPreview = desktop || pane === "preview";

  return (
    <div className={cn("flex min-h-0 flex-1", !desktop && "flex-col")}>
      {!desktop && <Segmented label="Soạn hoặc xem trước" options={PANES} value={pane} onChange={setPane} />}
      {showForm && (
        <aside
          aria-label="Soạn trang web"
          className={cn("flex min-h-0 flex-col bg-card", desktop ? "w-96 shrink-0 border-r" : "flex-1")}
        >
          <Segmented label="Nhóm tùy chỉnh" options={TABS} value={tab} onChange={setTab} />
          <div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            {tab === "content" && <SectionList openId={openId} onOpen={setOpenId} />}
            {tab === "style" && <StylePicker />}
            {tab === "letter" && (
              <div className="space-y-4">
                <AudioPanel />
                <p className="rounded-lg border bg-accent/40 px-3 py-2.5 text-xs text-muted-foreground">
                  Tên người nhận, người gửi, màu phong bì & dấu sáp được chỉnh tập trung 1 lần ở mục{" "}
                  <strong className="text-foreground">Bản in → Phong bì</strong>.
                </p>
              </div>
            )}
            <WebProblems />
          </div>
        </aside>
      )}
      {showPreview && <WebPreview focusId={tab === "content" ? openId : null} />}
    </div>
  );
}
