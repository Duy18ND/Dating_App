"use client";

import { Eye, EyeOff } from "lucide-react";
import { useId, useState, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

// Chữ 16px: Safari trên iPhone tự phóng to trang khi ô nhập nhỏ hơn mức này. Cao 44px để dễ chạm.
const authInput =
  "h-11 w-full rounded-lg border bg-card px-3 text-base outline-none transition-shadow focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20";

type FieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "id" | "className"> & {
  label: string;
  hint?: ReactNode;
  error?: string;
  /** Nút nằm trong ô, bên phải. */
  trailing?: ReactNode;
};

export function AuthField({ label, hint, error, trailing, ...input }: FieldProps) {
  const id = useId();
  const describedBy = [error && `${id}-error`, hint && `${id}-hint`].filter(Boolean).join(" ");
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          className={cn(authInput, trailing && "pr-12")}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy || undefined}
          {...input}
        />
        {trailing}
      </div>
      {error && (
        <p id={`${id}-error`} role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      {hint && (
        <div id={`${id}-hint`} className="text-xs text-muted-foreground">
          {hint}
        </div>
      )}
    </div>
  );
}

/** Ô mật khẩu có nút hiện/ẩn, để người dùng điện thoại soát lại điều mình gõ. */
export function PasswordField(props: Omit<FieldProps, "type" | "trailing">) {
  const [visible, setVisible] = useState(false);
  return (
    <AuthField
      {...props}
      type={visible ? "text" : "password"}
      autoCapitalize="none"
      autoCorrect="off"
      spellCheck={false}
      maxLength={72}
      trailing={
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
          aria-pressed={visible}
          className="absolute top-0 right-0 flex size-11 items-center justify-center rounded-r-lg text-muted-foreground hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {visible ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
        </button>
      }
    />
  );
}
