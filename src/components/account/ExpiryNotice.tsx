import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { expiryState, formatDate } from "@/lib/my-letters";

/** Ngày hết hạn; còn <= 7 ngày thì cảnh báo và nhắc quay màn hình làm kỷ niệm (FR-14). */
export function ExpiryNotice({
  expiresAt,
  now,
  detailed = false,
}: {
  expiresAt: string;
  /** Mốc thời gian lúc tải danh sách, để mọi thẻ tính cùng một mốc. */
  now: number;
  detailed?: boolean;
}) {
  const { days, expired, warning } = expiryState(expiresAt, now);
  const tip = "Hãy quay màn hình khi mở thiệp nếu muốn giữ làm kỷ niệm.";

  if (expired) {
    return (
      <p className="text-xs font-medium text-destructive">
        Đã hết hạn, mã QR không còn mở được. Thiệp sẽ bị xóa trong lần dọn dẹp tới.
      </p>
    );
  }
  return (
    <div
      className={cn(
        "text-xs",
        warning ? "flex items-start gap-1.5 rounded-md bg-accent p-2 font-medium text-primary" : "text-muted-foreground",
      )}
      role={warning ? "status" : undefined}
    >
      {warning && <AlertTriangle aria-hidden className="mt-0.5 size-3.5 shrink-0" />}
      <span>
        Hết hạn {formatDate(expiresAt)} (còn {days} ngày){warning ? `. Mã QR sắp ngừng hoạt động. ${tip}` : "."}
        {!warning && detailed && ` ${tip}`}
      </span>
    </div>
  );
}
