"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function CopyButton({ value, label = "Sao chép" }: { value: string; label?: string }) {
  const [result, setResult] = useState<{ value: string; ok: boolean }>();
  // Đổi giá trị thì nút trở về trạng thái chưa chép.
  const current = result?.value === value ? result : undefined;

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={() =>
        navigator.clipboard.writeText(value).then(
          () => setResult({ value, ok: true }),
          () => setResult({ value, ok: false }),
        )
      }
    >
      {current?.ok ? <Check /> : <Copy />}
      <span aria-live="polite">
        {current ? (current.ok ? "Đã chép" : "Không chép được, hãy chép tay") : label}
      </span>
    </Button>
  );
}
