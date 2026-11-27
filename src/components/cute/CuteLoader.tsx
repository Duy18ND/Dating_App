import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";

/** Ba trái tim nhún nhảy trong lúc chờ. */
export function CuteLoader({
  label = "Đang tải...",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div
      role="status"
      className={cn("flex flex-col items-center gap-3 px-4 py-16 text-center", className)}
    >
      <span aria-hidden className="flex gap-2 text-primary">
        {[0, 1, 2].map((i) => (
          <Heart
            key={i}
            className="anim-hop size-5 fill-current"
            style={{ animationDelay: `${i * 140}ms` }}
          />
        ))}
      </span>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}
