"use client";

import { useEditorStore } from "@/lib/editor/store";
import { Field, inputClass } from "./ui";

/** Ô chữ một dòng; rời ô thì kết thúc bước Undo đang gộp. */
export function TextInput({
  label,
  value,
  maxLength,
  type = "text",
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  maxLength: number;
  type?: string;
  placeholder?: string;
  onChange: (value: string) => void;
}) {
  const endCoalesce = useEditorStore((s) => s.endCoalesce);
  return (
    <Field label={label}>
      <input
        className={inputClass}
        type={type}
        value={value}
        maxLength={maxLength}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        onBlur={endCoalesce}
      />
    </Field>
  );
}

/** Ô chữ nhiều dòng, có đếm ký tự còn lại so với giới hạn. */
export function TextArea({
  label,
  value,
  maxLength,
  rows = 3,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  maxLength: number;
  rows?: number;
  placeholder?: string;
  onChange: (value: string) => void;
}) {
  const endCoalesce = useEditorStore((s) => s.endCoalesce);
  return (
    <Field label={`${label} (${value.length}/${maxLength})`}>
      <textarea
        className={inputClass}
        rows={rows}
        value={value}
        maxLength={maxLength}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        onBlur={endCoalesce}
      />
    </Field>
  );
}
