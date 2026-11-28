"use client";

import { ArrowDown, ArrowUp, ChevronDown, Images, Plus, Trash2, X } from "lucide-react";
import { nanoid } from "nanoid";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useEditorStore } from "@/lib/editor/store";
import { LIMITS } from "@/lib/validation";
import type {
  CounterMode,
  MemoryItem,
  PhotoboothAnimation,
  PhotoboothLayout,
  WebImage,
  WebSection,
  WebSectionType,
} from "@/types/letter";
import { ColorField } from "../ColorField";
import { TextArea, TextInput } from "../TextInput";
import { BlockSettings } from "../WebPanel";
import { Choice } from "../ui";
import { useImageUpload } from "../useImageUpload";
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
        label="Câu mở đầu"
        placeholder="VD: Có vài điều nhỏ mình muốn gửi riêng cho cậu..."
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
        label="Ảnh kỷ niệm (không bắt buộc)"
        image={section.image}
        focusKey={`section:${section.id}:focus`}
        onChange={(image, key) =>
          useEditorStore.getState().updateWebSection(section.id, { image }, key)
        }
      />
      <TextInput
        label="Ngày gặp nhau"
        type="date"
        value={section.date ?? ""}
        maxLength={40}
        onChange={(date) => patch(section, { date: optional(date) }, "date")}
      />
      <TextArea
        label="Câu chuyện"
        placeholder="Kể lại lần đầu gặp nhau hoặc ấn tượng khó quên..."
        rows={4}
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
        placeholder="VD: Ngày bên nhau"
        value={section.label}
        maxLength={LIMITS.maxCounterLabel}
        onChange={(label) => patch(section, { label }, "label")}
      />
    </>
  );
}

function MessageFields({ section }: { section: Of<"message"> }) {
  return (
    <>
      <TextInput
        label="Tiêu đề"
        placeholder="VD: Lời muốn gửi cậu"
        value={section.title}
        maxLength={LIMITS.maxMessageTitle}
        onChange={(title) => patch(section, { title }, "title")}
      />
      <TextArea
        label="Nội dung bức thư"
        placeholder="Viết những điều bạn muốn gửi gắm (để trống 1 dòng để tách đoạn)..."
        rows={7}
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
        placeholder="VD: Cảm ơn cậu đã đọc đến dòng cuối này nhé..."
        value={section.text}
        maxLength={LIMITS.maxEndingText}
        onChange={(text) => patch(section, { text }, "text")}
      />
      <TextInput
        label="Chữ ký (để trống sẽ lấy tên người gửi)"
        placeholder="VD: Từ người thương"
        value={section.signature ?? ""}
        maxLength={LIMITS.maxLetterLine}
        onChange={(signature) => patch(section, { signature }, "signature")}
      />
    </>
  );
}

const STRIP_COLORS = ["#FFFDF9", "#1E1B1A", "#FDECEF", "#E9F0E6", "#EAF2FA", "#F3E6CE"];
const FOIL_COLORS = ["#D9B36C", "#E5A9B8", "#C4CDD9", "#8E2424", "#7AA082"];

const PHOTOBOOTH_LAYOUT_OPTIONS: { value: PhotoboothLayout; label: string }[] = [
  { value: "strip", label: "Dải dọc" },
  { value: "grid2x2", label: "Lưới 2×2" },
  { value: "film", label: "Cuộn phim" },
  { value: "polaroid", label: "Polaroid" },
];

const PHOTOBOOTH_ANIMATION_OPTIONS: { value: PhotoboothAnimation; label: string }[] = [
  { value: "print_slide", label: "In trượt ra" },
  { value: "flash_snap", label: "Chớp flash" },
  { value: "film_scroll", label: "Cuộn phim chạy" },
  { value: "polaroid_drop", label: "Rơi xếp chồng" },
  { value: "none", label: "Tĩnh" },
];

function PhotoboothFields({ section }: { section: Of<"photobooth"> }) {
  const endCoalesce = useEditorStore((s) => s.endCoalesce);
  const multiInput = useRef<HTMLInputElement>(null);
  const { uploadMany, busy, progress, error, used, max, full } = useImageUpload("web");
  const [openPhoto, setOpenPhoto] = useState<number | null>(null);

  const maxPhotos = LIMITS.maxPhotoboothPhotos;
  const remainingSlots = Math.max(0, maxPhotos - section.photos.length);

  const setPhotos = (photos: WebImage[], key?: string) =>
    useEditorStore
      .getState()
      .updateWebSection(section.id, { photos } as Partial<WebSection>, key);

  const movePhoto = (index: number, delta: -1 | 1) => {
    const target = index + delta;
    if (target < 0 || target >= section.photos.length) return;
    const next = [...section.photos];
    const [moved] = next.splice(index, 1);
    next.splice(target, 0, moved);
    setPhotos(next);
    setOpenPhoto((cur) => (cur === index ? target : cur === target ? index : cur));
  };

  return (
    <>
      <p className="text-xs text-muted-foreground">
        Chọn nhiều ảnh cùng lúc (tối đa {maxPhotos} ảnh), ghép theo khung Photobooth và bật hiệu ứng
        chuyển động khi mở thiệp.
      </p>
      <TextInput
        label="Tiêu đề phần"
        value={section.title ?? ""}
        maxLength={LIMITS.maxMessageTitle}
        onChange={(title) => patch(section, { title }, "title")}
      />
      <div className="space-y-1.5">
        <p className="text-xs font-medium text-muted-foreground">Kiểu khung Photobooth</p>
        <Choice
          options={PHOTOBOOTH_LAYOUT_OPTIONS}
          value={section.layout ?? "strip"}
          onChange={(layout) => patch(section, { layout })}
        />
      </div>
      <div className="space-y-1.5">
        <p className="text-xs font-medium text-muted-foreground">Hiệu ứng chuyển động</p>
        <Choice
          options={PHOTOBOOTH_ANIMATION_OPTIONS}
          value={section.animation ?? "print_slide"}
          onChange={(animation) => patch(section, { animation })}
        />
      </div>
      <ColorField
        label="Màu dải phim Photobooth"
        colors={STRIP_COLORS}
        value={section.stripColor ?? "#FFFDF9"}
        onChange={(stripColor, custom) =>
          patch(section, { stripColor }, custom ? "strip-color" : undefined)
        }
        onCommit={endCoalesce}
      />

      {/* Chọn nhiều ảnh cùng lúc */}
      <div className="space-y-2 rounded-lg border border-dashed bg-accent/40 p-2.5">
        <input
          ref={multiInput}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(event) => {
            const files = event.target.files;
            void uploadMany(files, remainingSlots, (uploaded) => {
              const current = latest(section);
              const added: WebImage[] = uploaded.map(({ url }) => ({ src: url, fit: "cover" }));
              setPhotos([...current.photos, ...added].slice(0, maxPhotos));
            });
            event.target.value = "";
          }}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full bg-card"
          disabled={busy || full || remainingSlots <= 0}
          onClick={() => multiInput.current?.click()}
        >
          <Images className="size-4" />
          {busy && progress
            ? `Đang tải ${progress.done}/${progress.total} ảnh...`
            : remainingSlots > 0
              ? `Chọn nhiều ảnh cùng lúc (${section.photos.length}/${maxPhotos})`
              : `Đã đủ ${maxPhotos}/${maxPhotos} ảnh`}
        </Button>
        <p className="text-[11px] text-muted-foreground">
          Giữ Ctrl / Shift hoặc chọn nhiều ảnh trên điện thoại để tải 1 lần. Trang web đã dùng{" "}
          {used}/{max} ảnh.
        </p>
        {error && (
          <p role="alert" className="text-xs text-destructive">
            {error}
          </p>
        )}
      </div>

      {/* Danh sách ảnh gọn: xem trước, đổi thứ tự, xóa hoặc mở chỉnh khung */}
      {section.photos.length > 0 && (
        <div className="space-y-2">
          {section.photos.map((photo, index) => {
            const expanded = openPhoto === index;
            return (
              <div key={`${photo.src}-${index}`} className="rounded-md border bg-card">
                <div className="flex items-center gap-2 p-1.5">
                  {/* eslint-disable-next-line @next/next/no-img-element -- ảnh thu nhỏ R2 */}
                  <img
                    src={photo.src}
                    alt={`Ảnh ${index + 1}`}
                    className="size-10 shrink-0 rounded object-cover"
                  />
                  <button
                    type="button"
                    aria-expanded={expanded}
                    onClick={() => setOpenPhoto(expanded ? null : index)}
                    className="flex min-w-0 flex-1 items-center gap-1 text-left text-xs font-medium"
                  >
                    <ChevronDown
                      className={`size-3.5 shrink-0 transition-transform ${expanded ? "" : "-rotate-90"}`}
                    />
                    <span className="truncate">Ảnh {index + 1}</span>
                    <span className="text-[11px] font-normal text-muted-foreground">
                      · {expanded ? "Thu gọn" : "Chỉnh khung"}
                    </span>
                  </button>
                  <div className="flex shrink-0 items-center">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-7"
                      aria-label={`Đưa ảnh ${index + 1} lên`}
                      disabled={index === 0}
                      onClick={() => movePhoto(index, -1)}
                    >
                      <ArrowUp className="size-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-7"
                      aria-label={`Đưa ảnh ${index + 1} xuống`}
                      disabled={index === section.photos.length - 1}
                      onClick={() => movePhoto(index, 1)}
                    >
                      <ArrowDown className="size-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-7 text-destructive"
                      aria-label={`Xóa ảnh ${index + 1}`}
                      onClick={() => {
                        const current = latest(section);
                        setPhotos(current.photos.filter((_, i) => i !== index));
                        setOpenPhoto((cur) => (cur === index ? null : cur !== null && cur > index ? cur - 1 : cur));
                      }}
                    >
                      <X className="size-3.5" />
                    </Button>
                  </div>
                </div>
                {expanded && (
                  <div className="border-t p-2.5">
                    <WebImageField
                      label={`Tùy chỉnh ảnh ${index + 1}`}
                      image={photo}
                      defaultFit="cover"
                      focusKey={`section:${section.id}:photo-${index}`}
                      onChange={(next, key) => {
                        const current = latest(section);
                        if (!next) {
                          setPhotos(current.photos.filter((_, i) => i !== index));
                          setOpenPhoto(null);
                        } else {
                          setPhotos(
                            current.photos.map((p, i) => (i === index ? next : p)),
                            key,
                          );
                        }
                      }}
                    />
                  </div>
                )}
              </div>
            );
          })}
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
      return (
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
          <Trash2 className="size-3.5" /> Xóa khung cũ này
        </Button>
      );
  }
}
