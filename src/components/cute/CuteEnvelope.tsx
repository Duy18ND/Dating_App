import { cn } from "@/lib/utils";

/** Phong bì có tấm thư biết cười thò lên. Chỉ để trang trí nên ẩn với trình đọc màn hình. */
export function CuteEnvelope({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 170" aria-hidden className={cn("h-auto w-40", className)}>
      {/* Thân sau và nắp đã mở */}
      <path d="M20 72 L100 20 L180 72 Z" fill="#B8946D" />
      <rect x="20" y="70" width="160" height="90" rx="8" fill="#B8946D" />
      {/* Tấm thư */}
      <g className="anim-peek">
        <rect x="40" y="38" width="120" height="96" rx="8" fill="#FFFDF9" stroke="#E8E1D9" />
        <g className="anim-blink">
          <circle cx="82" cy="70" r="5" fill="#2B2623" />
          <circle cx="118" cy="70" r="5" fill="#2B2623" />
        </g>
        <path
          d="M89 82 Q100 93 111 82"
          fill="none"
          stroke="#2B2623"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        <ellipse cx="70" cy="82" rx="8" ry="5" fill="#F2A7B0" opacity="0.75" />
        <ellipse cx="130" cy="82" rx="8" ry="5" fill="#F2A7B0" opacity="0.75" />
      </g>
      {/* Túi trước */}
      <path
        d="M20 74 L100 124 L180 74 L180 152 Q180 160 172 160 L28 160 Q20 160 20 152 Z"
        fill="#D6B992"
      />
      <path d="M22 158 L82 112 M178 158 L118 112" stroke="#C8A882" strokeWidth="2" />
      {/* Dấu sáp hình tim */}
      <g className="anim-beat">
        <circle cx="100" cy="126" r="17" fill="#8E2424" />
        <path
          d="M100 135 C88 127 90 117 96 118 C98 118 100 120 100 122 C100 120 102 118 104 118 C110 117 112 127 100 135 Z"
          fill="#FFE3E6"
        />
      </g>
    </svg>
  );
}
