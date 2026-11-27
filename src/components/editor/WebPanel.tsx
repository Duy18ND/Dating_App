"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEditorStore } from "@/lib/editor/store";
import { LIMITS, webConfigSchema } from "@/lib/validation";
import type { WebConfig } from "@/types/letter";
import { ColorField } from "./ColorField";
import { ENVELOPE_COLORS } from "./EnvelopePanel";
import { TextInput } from "./TextInput";
import { Section, Toggle } from "./ui";

const SEAL_COLORS = ["#8E2424", "#C9A227", "#2B2623", "#2F4A3A", "#243B5A", "#B0566B"];
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
            label="Nút từ chối né chuột (cho vui)"
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

/** Tên người gửi/nhận, màu phong bì, dấu sáp và 3 khối tương tác. */
export function WebPanel() {
  const config = useEditorStore((s) => s.doc.web_config);
  const setWebConfig = useEditorStore((s) => s.setWebConfig);
  const endCoalesce = useEditorStore((s) => s.endCoalesce);
  // Báo sớm lỗi mà API sẽ từ chối khi xuất bản.
  const check = webConfigSchema.safeParse(config);
  const problems = check.success ? [] : [...new Set(check.error.issues.map((i) => i.message))];

  return (
    <div className="space-y-6">
      <Section title="Phong bì">
        <TextInput
          label="Tên người nhận"
          value={config.recipientName}
          maxLength={LIMITS.maxNameLength}
          onChange={(recipientName) => setWebConfig({ recipientName }, "recipient")}
        />
        <TextInput
          label="Tên người gửi"
          value={config.senderName}
          maxLength={LIMITS.maxNameLength}
          onChange={(senderName) => setWebConfig({ senderName }, "sender")}
        />
        <ColorField
          label="Màu phong bì"
          colors={ENVELOPE_COLORS}
          value={config.envelopeColor}
          onChange={(envelopeColor, custom) =>
            setWebConfig({ envelopeColor }, custom ? "envelope" : undefined)
          }
          onCommit={endCoalesce}
        />
        <ColorField
          label="Màu dấu sáp"
          colors={SEAL_COLORS}
          value={config.waxSealColor}
          onChange={(waxSealColor, custom) =>
            setWebConfig({ waxSealColor }, custom ? "seal" : undefined)
          }
          onCommit={endCoalesce}
        />
      </Section>
      <AcceptBlock />
      <RsvpBlock />
      <PollBlock />
      {problems.length > 0 && (
        <ul role="alert" className="space-y-1 text-sm text-destructive">
          {problems.map((problem) => (
            <li key={problem}>{problem}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
