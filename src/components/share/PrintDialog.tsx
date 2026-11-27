"use client";

import { Dialog } from "@base-ui/react/dialog";
import { Download, FileText, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { PrintKitInput } from "@/lib/client/export-pdf";
import { CARD_SIZE_LABEL, PrintSizes } from "./PrintSizes";

const SETTINGS: [string, string][] = [
  ["Khổ giấy", "A4"],
  ["Tỉ lệ", "100% / Kích thước thực (không chọn “Vừa trang”)"],
  ["In hai mặt", "Bật, lật theo cạnh dài"],
  ["Loại giấy", "Bìa / giấy dày, 180–200 gsm"],
  ["Số trang", "2 trang (là hai mặt của 1 tờ)"],
];

/**
 * Bấm tải thì hiện ngay cách chỉnh máy in và kích thước, rồi mới tải file.
 * Hướng dẫn nằm trên web, không in lên giấy.
 */
export function PrintDialog({
  input,
  fileName,
  label,
}: {
  input: PrintKitInput;
  fileName: string;
  label: string;
}) {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string>();

  async function download() {
    setBusy(true);
    setError(undefined);
    try {
      // Konva và jsPDF nặng, chỉ tải khi bấm nút.
      const { exportLetterPdf } = await import("@/lib/client/export-pdf");
      await exportLetterPdf({ ...input, fileName });
      setDone(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không xuất được PDF.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog.Root
      onOpenChange={() => {
        setDone(false);
        setError(undefined);
      }}
    >
      <Dialog.Trigger render={<Button type="button" />}>
        <FileText /> {label}
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-[60] bg-black/40" />
        <Dialog.Popup className="anim-pop fixed top-1/2 left-1/2 z-[60] flex max-h-[92dvh] w-[calc(100%-1.5rem)] max-w-md -translate-x-1/2 -translate-y-1/2 flex-col rounded-xl bg-background shadow-xl">
          <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
            <Dialog.Title className="font-semibold">Trước khi in, xem 1 phút</Dialog.Title>
            <Dialog.Close render={<Button variant="ghost" size="icon" aria-label="Đóng" />}>
              <X />
            </Dialog.Close>
          </div>

          <div className="space-y-4 overflow-y-auto px-4 py-3">
            <section className="space-y-1.5">
              <h3 className="text-sm font-semibold">1. Chỉnh trong hộp thoại in</h3>
              <dl className="rounded-lg border bg-card px-3 text-xs">
                {SETTINGS.map(([name, value]) => (
                  <div key={name} className="flex gap-3 border-b py-1.5 last:border-0">
                    <dt className="w-20 shrink-0 font-medium">{name}</dt>
                    <dd className="text-muted-foreground">{value}</dd>
                  </div>
                ))}
              </dl>
              <p className="text-xs text-muted-foreground">
                File đã cài sẵn “không co giãn” và “lật theo cạnh dài”, nhưng nhiều trình xem PDF
                (kể cả trình duyệt) bỏ qua. Hãy kiểm tra lại bằng mắt. Máy không tự đảo được giấy
                dày: in trang 1, đặt lại tờ giấy rồi in trang 2.
              </p>
            </section>

            <section className="space-y-1.5">
              <h3 className="text-sm font-semibold">2. In nháp rồi lấy thước đo</h3>
              <p className="rounded-lg bg-accent p-3 text-xs">
                Đo giữa các <strong>dấu cắt</strong> của thiệp phải đúng{" "}
                <strong>{CARD_SIZE_LABEL}</strong>. Nếu nhỏ hơn, máy đang co trang: chỉnh lại tỉ lệ
                100%. Sau đó soi lên đèn xem hai mặt thiệp có trùng không.
              </p>
            </section>

            <section className="space-y-1.5">
              <h3 className="text-sm font-semibold">3. Kích thước bộ in</h3>
              <PrintSizes />
            </section>
          </div>

          <div className="space-y-2 border-t px-4 py-3">
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
            {done && (
              <p role="status" className="text-sm">
                Đã tải file. Mở file rồi bấm in với các mục ở trên.
              </p>
            )}
            <Button type="button" className="h-11 w-full text-base" disabled={busy} onClick={download}>
              <Download /> {busy ? "Đang tạo PDF..." : done ? "Tải lại PDF" : "Tải PDF"}
            </Button>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
