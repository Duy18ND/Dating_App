"use client";

import { FileText } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { PrintKitInput } from "@/lib/client/export-pdf";
import type { PrintFile } from "@/lib/print/sheet";

const FILES: { file: PrintFile; label: string; paper: string; stem: string }[] = [
  {
    file: "envelope",
    label: "PDF phong bì",
    paper: "Giấy 120–160 gsm · in 1 mặt",
    stem: "phong-bi",
  },
  {
    file: "card",
    label: "PDF thiệp",
    paper: "Bìa 230–300 gsm · in 2 mặt, lật cạnh dài",
    stem: "thiep",
  },
];

/** Hai nút tải: mỗi file một loại giấy, kèm cách in ngay dưới nút để khỏi nạp nhầm. */
export function PrintDownloads({
  input,
  name,
}: {
  input: PrintKitInput;
  /** Đuôi tên file, ví dụ slug của thiệp hoặc "thu". */
  name: string;
}) {
  const [busy, setBusy] = useState<PrintFile>();
  const [error, setError] = useState<string>();

  async function download(file: PrintFile, stem: string) {
    setBusy(file);
    setError(undefined);
    try {
      // Konva và jsPDF nặng, chỉ tải khi bấm nút.
      const { exportPrintPdf } = await import("@/lib/client/export-pdf");
      await exportPrintPdf({ ...input, file, fileName: `${stem}-${name}.pdf` });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không xuất được PDF.");
    } finally {
      setBusy(undefined);
    }
  }

  return (
    <div className="space-y-2">
      <div className="grid gap-2 sm:grid-cols-2">
        {FILES.map(({ file, label, paper, stem }) => (
          <div key={file} className="space-y-1">
            <Button
              type="button"
              className="h-10 w-full"
              disabled={busy !== undefined}
              onClick={() => download(file, stem)}
            >
              <FileText /> {busy === file ? "Đang tạo PDF..." : `Tải ${label}`}
            </Button>
            <p className="text-center text-xs text-muted-foreground">{paper}</p>
          </div>
        ))}
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
