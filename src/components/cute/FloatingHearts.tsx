import { Heart, Sparkle } from "lucide-react";
import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

// Vị trí cố định (không random) để HTML server và trình duyệt giống nhau.
const BITS = [
  { x: 6, y: 18, size: 18, heart: true, delay: 0, duration: 4.2 },
  { x: 14, y: 62, size: 14, heart: false, delay: 900, duration: 3.6 },
  { x: 25, y: 7, size: 12, heart: false, delay: 1700, duration: 4.8 },
  { x: 74, y: 9, size: 16, heart: true, delay: 600, duration: 5 },
  { x: 87, y: 30, size: 12, heart: false, delay: 2100, duration: 3.8 },
  { x: 93, y: 68, size: 20, heart: true, delay: 1300, duration: 4.4 },
  { x: 80, y: 86, size: 11, heart: false, delay: 300, duration: 4 },
  { x: 7, y: 89, size: 12, heart: true, delay: 2500, duration: 5.2 },
];

/** Tim và sao lấp lánh trôi nhẹ phía sau nội dung. Khung cha cần `relative`. */
export function FloatingHearts({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("pointer-events-none absolute inset-0 overflow-hidden text-primary", className)}
    >
      {BITS.map((bit, index) => {
        const Icon = bit.heart ? Heart : Sparkle;
        return (
          <Icon
            key={index}
            className="anim-twinkle absolute fill-current opacity-30"
            style={
              {
                left: `${bit.x}%`,
                top: `${bit.y}%`,
                width: bit.size,
                height: bit.size,
                "--delay": `${bit.delay}ms`,
                "--duration": `${bit.duration}s`,
              } as CSSProperties
            }
          />
        );
      })}
    </div>
  );
}
