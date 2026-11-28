"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEditorStore } from "@/lib/editor/store";
import { DEFAULT_REPLY_REACTIONS } from "@/lib/responses";
import { webConfigSchema } from "@/lib/validation";
import type { WebConfig } from "@/types/letter";
import { TextInput } from "./TextInput";
import { Section, Toggle } from "./ui";

const MAX_POLL_OPTIONS = 4;

type Blocks = WebConfig["blocks"];

const DEFAULT_BLOCKS: Required<Blocks> = {
  acceptButton: {
    enabled: true,
    question: "Bạn đồng ý nhé?",
    yesText: "Đồng ý",
    noText: "Để suy nghĩ",
    dodgeNo: false,
  },
  rsvp: { enabled: true, eventDate: "", locationName: "", mapsUrl: "" },
  poll: { enabled: true, question: "Bạn thích món nào?", options: ["Lẩu", "Đồ nướng"] },
  reply: {
    enabled: true,
    prompt: "Cậu đọc xong rồi nhắn lại mình vài dòng nhé 💌",
    placeholder: "Viết vài dòng trả lời hoặc cảm nhận của cậu...",
    quickReactions: [...DEFAULT_REPLY_REACTIONS],
  },
};

/** Lưu thay đổi một khối; các lần gõ cùng `field` gộp thành một bước Undo. */
function useBlock<K extends keyof Blocks>(name: K) {
  const block = useEditorStore((s) => s.doc.web_config.blocks[name]);
  const setWebConfig = useEditorStore((s) => s.setWebConfig);
  const set = (patch: Partial<Required<Blocks>[K]>, field?: string) => {
    const blocks = useEditorStore.getState().doc.web_config.blocks;
    setWebConfig(
      { blocks: { ...blocks, [name]: { ...(blocks[name] ?? DEFAULT_BLOCKS[name]), ...patch } } },
      field && `${name}:${field}`,
    );
  };
  return [block, set] as const;
}

function AcceptBlock() {
  const [block, set] = useBlock("acceptButton");
  return (
    <Section title="Nút Đồng ý">
      <Toggle
        label="Bật câu hỏi kèm nút Đồng ý"
        checked={block?.enabled ?? false}
        onChange={(enabled) => set({ enabled })}
      />
      {block?.enabled && (
        <>
          <TextInput
            label="Câu hỏi"
            value={block.question}
            maxLength={200}
            onChange={(question) => set({ question }, "question")}
          />
          <TextInput
            label="Chữ trên nút đồng ý"
            value={block.yesText}
            maxLength={40}
            onChange={(yesText) => set({ yesText }, "yes")}
          />
          <TextInput
            label="Chữ trên nút từ chối"
            value={block.noText}
            maxLength={40}
            onChange={(noText) => set({ noText }, "no")}
          />
          <Toggle
            label="Bắt buộc bấm Đồng ý (nút Từ chối chạy mãi)"
            checked={block.dodgeNo}
            onChange={(dodgeNo) => set({ dodgeNo })}
          />
        </>
      )}
    </Section>
  );
}

function RsvpBlock() {
  const [block, set] = useBlock("rsvp");
  return (
    <Section title="Xác nhận tham dự">
      <Toggle
        label="Bật form RSVP và bản đồ"
        checked={block?.enabled ?? false}
        onChange={(enabled) => set({ enabled })}
      />
      {block?.enabled && (
        <>
          <TextInput
            label="Thời gian"
            type="datetime-local"
            value={block.eventDate}
            maxLength={40}
            onChange={(eventDate) => set({ eventDate }, "date")}
          />
          <TextInput
            label="Địa điểm"
            value={block.locationName}
            maxLength={200}
            onChange={(locationName) => set({ locationName }, "location")}
          />
          <TextInput
            label="Link Google Maps (không bắt buộc)"
            type="url"
            placeholder="https://maps.app.goo.gl/..."
            value={block.mapsUrl}
            maxLength={500}
            onChange={(mapsUrl) => set({ mapsUrl }, "maps")}
          />
        </>
      )}
    </Section>
  );
}

function PollBlock() {
  const [block, set] = useBlock("poll");
  return (
    <Section title="Bình chọn">
      <Toggle
        label="Bật bình chọn món ăn hoặc giờ hẹn"
        checked={block?.enabled ?? false}
        onChange={(enabled) => set({ enabled })}
      />
      {block?.enabled && (
        <>
          <TextInput
            label="Câu hỏi"
            value={block.question}
            maxLength={200}
            onChange={(question) => set({ question }, "question")}
          />
          {block.options.map((option, index) => (
            <div key={index} className="flex items-end gap-2">
              <div className="flex-1">
                <TextInput
                  label={`Phương án ${index + 1}`}
                  value={option}
                  maxLength={120}
                  onChange={(next) =>
                    set(
                      { options: block.options.map((o, i) => (i === index ? next : o)) },
                      `option-${index}`,
                    )
                  }
                />
              </div>
              {block.options.length > 2 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`Xóa phương án ${index + 1}`}
                  onClick={() => set({ options: block.options.filter((_, i) => i !== index) })}
                >
                  <X />
                </Button>
              )}
            </div>
          ))}
          {block.options.length < MAX_POLL_OPTIONS && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => set({ options: [...block.options, ""] })}
            >
              Thêm phương án
            </Button>
          )}
        </>
      )}
    </Section>
  );
}

function ReplyBlockSettings() {
  const [block, set] = useBlock("reply");
  const reactions = block?.quickReactions ?? [...DEFAULT_REPLY_REACTIONS];
  return (
    <Section title="Xác nhận & Hồi âm thư">
      <Toggle
        label="Bật khung xác nhận đã đọc & gửi hồi âm"
        checked={block?.enabled ?? false}
        onChange={(enabled) => set({ enabled })}
      />
      {block?.enabled && (
        <>
          <p className="text-xs text-muted-foreground">
            Câu trả lời của người nhận sẽ gửi thẳng về mục “Thiệp của tôi” trong tài khoản của bạn.
          </p>
          <TextInput
            label="Lời mời trả lời"
            value={block.prompt}
            maxLength={200}
            onChange={(prompt) => set({ prompt }, "prompt")}
          />
          <TextInput
            label="Gợi ý trong ô viết hồi âm"
            value={block.placeholder ?? ""}
            maxLength={160}
            onChange={(placeholder) => set({ placeholder }, "placeholder")}
          />
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">Nút xác nhận nhanh (tối đa 6)</p>
            {reactions.map((item, index) => (
              <div key={index} className="flex items-end gap-2">
                <div className="flex-1">
                  <TextInput
                    label={`Nút ${index + 1}`}
                    value={item}
                    maxLength={60}
                    onChange={(next) =>
                      set(
                        { quickReactions: reactions.map((r, i) => (i === index ? next : r)) },
                        `reaction-${index}`,
                      )
                    }
                  />
                </div>
                {reactions.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Xóa nút ${index + 1}`}
                    onClick={() => set({ quickReactions: reactions.filter((_, i) => i !== index) })}
                  >
                    <X />
                  </Button>
                )}
              </div>
            ))}
            {reactions.length < 6 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => set({ quickReactions: [...reactions, ""] })}
              >
                Thêm nút xác nhận
              </Button>
            )}
          </div>
        </>
      )}
    </Section>
  );
}

/** Các khối tương tác của phần "Câu hỏi & Tương tác" (FR-06). */
export function BlockSettings() {
  return (
    <div className="space-y-6">
      <ReplyBlockSettings />
      <AcceptBlock />
      <RsvpBlock />
      <PollBlock />
    </div>
  );
}

/** Báo sớm lỗi mà API sẽ từ chối khi xuất bản. */
export function WebProblems() {
  const config = useEditorStore((s) => s.doc.web_config);
  const check = webConfigSchema.safeParse(config);
  const problems = check.success ? [] : [...new Set(check.error.issues.map((i) => i.message))];
  if (problems.length === 0) return null;
  return (
    <ul role="alert" className="space-y-1 text-sm text-destructive">
      {problems.map((problem) => (
        <li key={problem}>{problem}</li>
      ))}
    </ul>
  );
}
