"use client";

import { Dialog } from "@base-ui/react/dialog";
import { X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { runCelebration } from "@/lib/celebrate";
import { AuthRequiredError, createLetter, updateLetter } from "@/lib/client/api";
import { warmTurnstile } from "@/lib/client/turnstile";
import { useEditorStore } from "@/lib/editor/store";
import { loginPath } from "@/lib/safe-redirect";
import { letterPayloadSchema } from "@/lib/validation";
import { DonatePanel } from "./DonatePanel";
import { SharePanel } from "./SharePanel";

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
  const [needsLogin, setNeedsLogin] = useState(false);

  async function publish() {
    if (busy) return;
    setOpen(true);
    setBusy(true);
    setError(undefined);
    setNeedsLogin(false);
    try {
      const payload = useEditorStore.getState().doc;
      const check = letterPayloadSchema.safeParse(payload);
      if (!check.success) throw new Error(check.error.issues[0].message);
      const target = useEditorStore.getState().published;
      if (target) await updateLetter(target.id, payload);
      else {
        const created = await createLetter(payload);
        setPublished({ id: created.id, slug: created.slug });
        // Tải lại trang vẫn mở đúng thiệp này để sửa tiếp, không tạo thiệp mới.
        window.history.replaceState(null, "", `/editor?id=${created.id}`);
        runCelebration("heart_rain", "medium");
      }
      markSaved(payload);
    } catch (cause) {
      setNeedsLogin(cause instanceof AuthRequiredError);
      setError(cause instanceof Error ? cause.message : "Xuất bản không được, hãy thử lại.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Button
        type="button"
        onClick={publish}
        onPointerEnter={!published ? warmTurnstile : undefined}
        onFocus={!published ? warmTurnstile : undefined}
        disabled={busy}
      >
        {published ? "Lưu thay đổi" : "Xuất bản"}
      </Button>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-40 bg-black/40" />
        <Dialog.Popup className="anim-pop fixed top-1/2 left-1/2 z-50 max-h-[90dvh] w-[calc(100%-2rem)] max-w-3xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl bg-background p-5 shadow-xl">
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
              {needsLogin ? (
                // Mở tab mới để không mất bản đang soạn; đăng nhập xong quay lại bấm Thử lại.
                <a
                  href={loginPath("/thiep-cua-toi")}
                  target="_blank"
                  rel="noopener"
                  className={buttonVariants({ variant: "outline" })}
                >
                  Đăng nhập lại (mở tab mới)
                </a>
              ) : null}
              <Button type="button" onClick={publish}>
                Thử lại
              </Button>
            </div>
          )}

          {!busy && !error && published && (
            // Mobile xếp một cột: link và PDF trước, donate bên dưới.
            <div className="mt-4 grid gap-5 md:has-[>aside]:grid-cols-[3fr_2fr]">
              <div className="space-y-4">
                <SharePanel
                  slug={published.slug}
                  canvas={doc.canvas_data}
                  envelopeColor={doc.web_config.envelopeColor}
                  recipientName={doc.web_config.recipientName}
                  defaultHideBackground={hideBackground}
                />
                <div className="space-y-2 rounded-lg border bg-accent p-3 text-sm">
                  <p>
                    Thiệp đã được lưu vào tài khoản của bạn. Xem lượt mở, phản hồi và sửa thiệp
                    bất cứ lúc nào trong Thiệp của tôi. Mã QR trên thiệp giấy ngừng hoạt động sau
                    60 ngày.
                  </p>
                  <Link
                    href={`/thiep-cua-toi/${published.id}`}
                    className={buttonVariants({ variant: "outline", size: "sm" })}
                  >
                    Mở trang chi tiết thiệp
                  </Link>
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
