"use client";

/** Bảng màu gợi ý kèm ô chọn màu tự do. Giá trị luôn là '#RRGGBB'. */
export function ColorField({
  label,
  colors,
  value,
  onChange,
  onCommit,
}: {
  label: string;
  colors: readonly string[];
  value: string;
  /** `custom` = đang kéo trong ô chọn màu, nên gộp các lần gọi vào một bước Undo. */
  onChange: (color: string, custom: boolean) => void;
  onCommit?: () => void;
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <div className="flex flex-wrap items-center gap-2">
        {colors.map((color) => (
          <button
            key={color}
            type="button"
            aria-label={`${label} ${color}`}
            aria-pressed={value.toUpperCase() === color.toUpperCase()}
            onClick={() => onChange(color, false)}
            className="size-7 rounded-full border-2 aria-pressed:border-primary aria-pressed:ring-2 aria-pressed:ring-ring"
            style={{ backgroundColor: color }}
          />
        ))}
        <input
          type="color"
          aria-label={`${label}: chọn màu khác`}
          className="size-8 cursor-pointer rounded border bg-card"
          value={value}
          onChange={(event) => onChange(event.target.value, true)}
          onBlur={onCommit}
        />
      </div>
    </div>
  );
}
