"use client";

import { Dialog } from "@base-ui/react/dialog";
import { X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { createLetter, updateLetter } from "@/lib/client/api";
import { useEditorStore } from "@/lib/editor/store";
import { letterPayloadSchema } from "@/lib/validation";
import { DonatePanel } from "./DonatePanel";
import { LinkRow, SharePanel } from "./SharePanel";

/** Nút Xuất bản kèm modal kết quả. Lần xuất bản sau cập nhật đúng thư cũ, giữ nguyên mã QR. */
export function PublishDialog() {
  const doc = useEditorStore((s) => s.doc);
  const published = useEditorStore((s) => s.published);
  const hideBackground = useEditorStore((s) => s.printHideBackground);
  const setPublished = useEditorStore((s) => s.setPublished);
  const markSaved = useEditorStore((s) => s.markSaved);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  async function publish() {
    if (busy) return;
    setOpen(true);
    setBusy(true);
    setError(undefined);
    try {
      const payload = useEditorStore.getState().doc;
      const check = letterPayloadSchema.safeParse(payload);
      if (!check.success) throw new Error(check.error.issues[0].message);
      const target = useEditorStore.getState().published;
      if (target) await updateLetter(target.slug, target.editToken, payload);
      else {
        const created = await createLetter(payload);
        setPublished({ slug: created.slug, editToken: created.edit_token });
      }
      markSaved(payload);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Xuất bản không được, hãy thử lại.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Button type="button" onClick={publish} disabled={busy}>
        {published ? "Lưu thay đổi" : "Xuất bản"}
      </Button>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-40 bg-black/40" />
        <Dialog.Popup className="fixed top-1/2 left-1/2 z-50 max-h-[90dvh] w-[calc(100%-2rem)] max-w-3xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl bg-background p-5 shadow-xl">
          <div className="flex items-start justify-between gap-4">
            <Dialog.Title className="text-lg font-semibold">
              {busy ? "Đang lưu lá thư..." : error ? "Chưa lưu được" : "Lá thư đã sẵn sàng"}
            </Dialog.Title>
            <Dialog.Close
              render={<Button variant="ghost" size="icon" aria-label="Đóng" />}
            >
              <X />
            </Dialog.Close>
          </div>

          {error && (
            <div className="mt-3 space-y-3">
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
              <Button type="button" onClick={publish}>
                Thử lại
              </Button>
            </div>
          )}

          {!busy && !error && published && (
            // Mobile xếp một cột: link và PDF trước, donate bên dưới.
            <div className="mt-4 grid gap-5 md:grid-cols-[3fr_2fr]">
              <div className="space-y-4">
                <SharePanel
                  slug={published.slug}
                  canvas={doc.canvas_data}
                  defaultHideBackground={hideBackground}
                />
                <div className="space-y-2 rounded-lg border border-primary/40 bg-accent p-3">
                  <p className="text-sm font-medium">
                    Hãy lưu link quản lý ngay. Đây là cách duy nhất để xem phản hồi và sửa thư.
                    Đừng gửi link này cho người nhận.
                  </p>
                  <LinkRow
                    label="Link quản lý bí mật"
                    url={`${window.location.origin}/manage/${published.editToken}`}
                  />
                </div>
              </div>
              <DonatePanel />
            </div>
          )}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
