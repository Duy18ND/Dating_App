"use client";

import { Plus, Trash2, X } from "lucide-react";
import { nanoid } from "nanoid";
import { Button } from "@/components/ui/button";
import { useEditorStore } from "@/lib/editor/store";
import { LIMITS } from "@/lib/validation";
import type { CounterMode, MemoryItem, WebImage, WebSection, WebSectionType } from "@/types/letter";
import { ColorField } from "../ColorField";
import { TextArea, TextInput } from "../TextInput";
import { BlockSettings } from "../WebPanel";
import { Choice } from "../ui";
import { BoardFields } from "./BoardFields";
import { WebImageField } from "./WebImageField";

type Of<T extends WebSectionType> = Extract<WebSection, { type: T }>;

/** Phần mới nhất trong store, để tải ảnh xong muộn không ghi đè chữ vừa gõ. */
function latest<T extends WebSectionType>(section: Of<T>): Of<T> {
  const found = useEditorStore
    .getState()
    .doc.web_config.sections?.find((s) => s.id === section.id);
  return (found as Of<T> | undefined) ?? section;
}

/** Cập nhật một phần; các lần gõ cùng `field` gộp thành một bước Undo. */
function patch<T extends WebSectionType>(section: Of<T>, changes: Partial<Of<T>>, field?: string) {
  useEditorStore
    .getState()
    .updateWebSection(
      section.id,
      changes as Partial<WebSection>,
      field && `section:${section.id}:${field}`,
    );
}

const optional = (value: string) => value || undefined;

function HeroFields({ section }: { section: Of<"hero"> }) {
  return (
    <>
      <p className="text-xs text-muted-foreground">
        Tiêu đề “Gửi [tên]” tự lấy tên người nhận (hoặc tên trong link ?to=).
      </p>
      <WebImageField
        label="Ảnh bìa (không bắt buộc)"
        image={section.image}
        defaultFit="cover"
        focusKey={`section:${section.id}:focus`}
        onChange={(image, key) =>
          useEditorStore.getState().updateWebSection(section.id, { image }, key)
        }
      />
      <TextArea
        label="Câu dẫn"
        value={section.lead}
        maxLength={LIMITS.maxHeroLead}
        onChange={(lead) => patch(section, { lead }, "lead")}
      />
    </>
  );
}

function FirstDayFields({ section }: { section: Of<"first_day"> }) {
  return (
    <>
      <WebImageField
        label="Ảnh (không bắt buộc)"
        image={section.image}
        focusKey={`section:${section.id}:focus`}
        onChange={(image, key) =>
          useEditorStore.getState().updateWebSection(section.id, { image }, key)
        }
      />
      <TextInput
        label="Ngày"
        type="date"
        value={section.date ?? ""}
        maxLength={40}
        onChange={(date) => patch(section, { date: optional(date) }, "date")}
      />
      <TextArea
        label="Câu chuyện"
        rows={5}
        value={section.text}
        maxLength={LIMITS.maxFirstDayText}
        onChange={(text) => patch(section, { text }, "text")}
      />
    </>
  );
}

function MemoriesFields({ section }: { section: Of<"memories"> }) {
  const setItem = (itemId: string, changes: Partial<MemoryItem>, field?: string) => {
    const current = latest(section);
    patch(
      current,
      { items: current.items.map((i) => (i.id === itemId ? { ...i, ...changes } : i)) },
      field && `${itemId}:${field}`,
    );
  };

  return (
    <>
      <TextInput
        label="Tiêu đề phần"
        value={section.title ?? ""}
        maxLength={LIMITS.maxMessageTitle}
        onChange={(title) => patch(section, { title }, "title")}
      />
      {section.items.map((item, index) => (
        <fieldset key={item.id} className="space-y-2 rounded-md border p-3">
          <legend className="px-1 text-xs font-semibold">Kỷ niệm {index + 1}</legend>
          <WebImageField
            label="Ảnh"
            image={item.image}
            focusKey={`section:${section.id}:${item.id}:focus`}
            onChange={(image, key) => {
              const current = latest(section);
              useEditorStore
                .getState()
                .updateWebSection(
                  section.id,
                  {
                    items: current.items.map((i) => (i.id === item.id ? { ...i, image } : i)),
                  } as Partial<WebSection>,
                  key,
                );
            }}
          />
          <TextInput
            label="Ngày (không bắt buộc)"
            type="date"
            value={item.date ?? ""}
            maxLength={40}
            onChange={(date) => setItem(item.id, { date: optional(date) }, "date")}
          />
          <TextArea
            label="Chú thích"
            rows={2}
            value={item.caption}
            maxLength={LIMITS.maxMemoryCaption}
            onChange={(caption) => setItem(item.id, { caption }, "caption")}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => patch(section, { items: section.items.filter((i) => i.id !== item.id) })}
          >
            <X /> Xóa kỷ niệm {index + 1}
          </Button>
        </fieldset>
      ))}
      {section.items.length < LIMITS.maxMemories && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            patch(section, { items: [...section.items, { id: nanoid(8), caption: "" }] })
          }
        >
          <Plus /> Thêm kỷ niệm
        </Button>
      )}
    </>
  );
}

function ReasonsFields({ section }: { section: Of<"reasons"> }) {
  return (
    <>
      <TextInput
        label="Tiêu đề phần"
        value={section.title ?? ""}
        maxLength={LIMITS.maxMessageTitle}
        onChange={(title) => patch(section, { title }, "title")}
      />
      {section.items.map((reason, index) => (
        <div key={index} className="flex items-end gap-1">
          <div className="flex-1">
            <TextArea
              label={`Câu ${index + 1}`}
              rows={2}
              value={reason}
              maxLength={LIMITS.maxReasonText}
              onChange={(next) =>
                patch(
                  section,
                  { items: section.items.map((r, i) => (i === index ? next : r)) },
                  `reason-${index}`,
                )
              }
            />
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={`Xóa câu ${index + 1}`}
            onClick={() => patch(section, { items: section.items.filter((_, i) => i !== index) })}
          >
            <X />
          </Button>
        </div>
      ))}
      {section.items.length < LIMITS.maxReasons && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => patch(section, { items: [...section.items, ""] })}
        >
          <Plus /> Thêm câu
        </Button>
      )}
    </>
  );
}

const COUNTER_OPTIONS: { value: CounterMode; label: string }[] = [
  { value: "since", label: "Đếm ngày đã qua" },
  { value: "until", label: "Đếm ngược" },
];

function CounterFields({ section }: { section: Of<"counter"> }) {
  return (
    <>
      <Choice
        options={COUNTER_OPTIONS}
        value={section.mode}
        onChange={(mode) => patch(section, { mode })}
      />
      <TextInput
        label="Ngày mốc"
        type="date"
        value={section.date}
        maxLength={40}
        onChange={(date) => patch(section, { date }, "date")}
      />
      <TextInput
        label="Nhãn dưới con số"
        value={section.label}
        maxLength={LIMITS.maxCounterLabel}
        onChange={(label) => patch(section, { label }, "label")}
      />
      <p className="text-xs text-muted-foreground">Số ngày tính theo ngày trên máy người xem.</p>
    </>
  );
}

function MessageFields({ section }: { section: Of<"message"> }) {
  return (
    <>
      <TextInput
        label="Tiêu đề"
        value={section.title}
        maxLength={LIMITS.maxMessageTitle}
        onChange={(title) => patch(section, { title }, "title")}
      />
      <TextArea
        label="Nội dung (để một dòng trống để xuống đoạn)"
        rows={10}
        value={section.body}
        maxLength={LIMITS.maxMessageBody}
        onChange={(body) => patch(section, { body }, "body")}
      />
    </>
  );
}

function EndingFields({ section }: { section: Of<"ending"> }) {
  return (
    <>
      <TextArea
        label="Câu kết"
        value={section.text}
        maxLength={LIMITS.maxEndingText}
        onChange={(text) => patch(section, { text }, "text")}
      />
      <TextInput
        label="Chữ ký (để trống sẽ dùng tên người gửi)"
        value={section.signature ?? ""}
        maxLength={LIMITS.maxLetterLine}
        onChange={(signature) => patch(section, { signature }, "signature")}
      />
      <p className="text-xs text-muted-foreground">
        Phần này kèm nút “Xem lại tấm thiệp” và gợi ý quay màn hình làm kỷ niệm.
      </p>
    </>
  );
}

const STRIP_COLORS = ["#FFFDF9", "#1E1B1A", "#FDECEF", "#E9F0E6", "#EAF2FA", "#F3E6CE"];
const FOIL_COLORS = ["#D9B36C", "#E5A9B8", "#C4CDD9", "#8E2424", "#7AA082"];

function PhotoboothFields({ section }: { section: Of<"photobooth"> }) {
  const endCoalesce = useEditorStore((s) => s.endCoalesce);
  const setPhotos = (photos: WebImage[], key?: string) =>
    useEditorStore
      .getState()
      .updateWebSection(section.id, { photos } as Partial<WebSection>, key);

  return (
    <>
      <p className="text-xs text-muted-foreground">
        Ghép 2–4 ảnh dọc thành dải Photobooth kiểu Hàn Quốc có chú thích và ngày ở chân dải ảnh.
      </p>
      <TextInput
        label="Tiêu đề phần"
        value={section.title ?? ""}
        maxLength={LIMITS.maxMessageTitle}
        onChange={(title) => patch(section, { title }, "title")}
      />
      <ColorField
        label="Màu dải phim Photobooth"
        colors={STRIP_COLORS}
        value={section.stripColor ?? "#FFFDF9"}
        onChange={(stripColor, custom) =>
          patch(section, { stripColor }, custom ? "strip-color" : undefined)
        }
        onCommit={endCoalesce}
      />
      {section.photos.map((photo, index) => (
        <fieldset key={`${photo.src}-${index}`} className="space-y-2 rounded-md border p-2.5">
          <legend className="px-1 text-xs font-semibold">Ảnh {index + 1}</legend>
          <WebImageField
            label={`Khung ảnh ${index + 1}`}
            image={photo}
            defaultFit="cover"
            focusKey={`section:${section.id}:photo-${index}`}
            onChange={(next, key) => {
              const current = latest(section);
              if (!next) {
                setPhotos(current.photos.filter((_, i) => i !== index));
              } else {
                setPhotos(
                  current.photos.map((p, i) => (i === index ? next : p)),
                  key,
                );
              }
            }}
          />
        </fieldset>
      ))}
      {section.photos.length < 4 && (
        <div className="rounded-md border border-dashed p-2.5">
          <WebImageField
            label={`Thêm ảnh vào dải (${section.photos.length}/4)`}
            image={undefined}
            defaultFit="cover"
            focusKey={`section:${section.id}:add`}
            onChange={(added) => {
              if (!added) return;
              const current = latest(section);
              setPhotos([...current.photos, { ...added, fit: "cover" }]);
            }}
          />
        </div>
      )}
      <TextInput
        label="Chú thích chân dải ảnh"
        value={section.caption ?? ""}
        maxLength={LIMITS.maxMemoryCaption}
        onChange={(caption) => patch(section, { caption }, "caption")}
      />
      <TextInput
        label="Ngày chụp (không bắt buộc)"
        type="date"
        value={section.date ?? ""}
        maxLength={40}
        onChange={(date) => patch(section, { date: optional(date) }, "date")}
      />
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="text-destructive"
        onClick={() => {
          const all = useEditorStore.getState().doc.web_config.sections ?? [];
          useEditorStore.getState().setWebSections(all.filter((s) => s.id !== section.id));
        }}
      >
        <Trash2 className="size-3.5" /> Xóa phần Photobooth
      </Button>
    </>
  );
}

function ScratchFields({ section }: { section: Of<"scratch"> }) {
  const endCoalesce = useEditorStore((s) => s.endCoalesce);
  return (
    <>
      <p className="text-xs text-muted-foreground">
        Che lời nhắn bất ngờ dưới lớp nhũ ánh kim — người nhận quẹt tay cào ra trên điện thoại!
      </p>
      <TextInput
        label="Dòng gợi ý trên lớp nhũ"
        value={section.prompt}
        maxLength={LIMITS.maxMessageTitle}
        onChange={(prompt) => patch(section, { prompt }, "prompt")}
      />
      <TextArea
        label="Lời nhắn bí mật bên dưới"
        rows={4}
        value={section.secret}
        maxLength={LIMITS.maxFirstDayText}
        onChange={(secret) => patch(section, { secret }, "secret")}
      />
      <ColorField
        label="Màu lớp nhũ cào"
        colors={FOIL_COLORS}
        value={section.foilColor ?? "#D9B36C"}
        onChange={(foilColor, custom) =>
          patch(section, { foilColor }, custom ? "foil-color" : undefined)
        }
        onCommit={endCoalesce}
      />
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="text-destructive"
        onClick={() => {
          const all = useEditorStore.getState().doc.web_config.sections ?? [];
          useEditorStore.getState().setWebSections(all.filter((s) => s.id !== section.id));
        }}
      >
        <Trash2 className="size-3.5" /> Xóa thẻ cào
      </Button>
    </>
  );
}

export function SectionFields({ section }: { section: WebSection }) {
  switch (section.type) {
    case "hero":
      return <HeroFields section={section} />;
    case "first_day":
      return <FirstDayFields section={section} />;
    case "memories":
      return <MemoriesFields section={section} />;
    case "photobooth":
      return <PhotoboothFields section={section} />;
    case "scratch":
      return <ScratchFields section={section} />;
    case "reasons":
      return <ReasonsFields section={section} />;
    case "counter":
      return <CounterFields section={section} />;
    case "message":
      return <MessageFields section={section} />;
    case "interact":
      return <BlockSettings />;
    case "ending":
      return <EndingFields section={section} />;
    case "board":
      return <BoardFields section={section} />;
  }
}
