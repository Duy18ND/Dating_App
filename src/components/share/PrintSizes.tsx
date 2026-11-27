import { PRINT_CONFIG } from "@/lib/print-config";

const {
  PAPER_A4_MM: a4,
  CARD_FACE_MM: card,
  ENVELOPE_C7_FLAT_MM: env,
  BLEED_MM: bleed,
} = PRINT_CONFIG;

const mm = (...values: number[]) => `${values.map((v) => String(v).replace(".", ",")).join(" × ")} mm`;

// Lấy thẳng từ PRINT_CONFIG, cùng số mà file PDF dùng, nên không lệch với bản in.
const ROWS: [string, string][] = [
  ["Khổ giấy", `A4, ${mm(a4.width, a4.height)} (không dùng Letter)`],
  ["Thiệp sau khi cắt", mm(card.width, card.height)],
  ["Phong bì sau khi gấp", mm(env.bodyWidth, env.bodyHeight)],
  [
    "Phong bì trải phẳng",
    mm(env.bodyWidth + env.sideFlap * 2, env.topFlap + env.bodyHeight + env.bottomFlap),
  ],
  [
    "Các nắp",
    `trên ${env.topFlap} mm (gồm tai cài ${env.tuckTab.width} × ${env.tuckTab.height}), dưới ${env.bottomFlap} mm, hai bên ${env.sideFlap} mm`,
  ],
  ["Khe cài", `rộng ${env.tuckSlit.width} mm, cách nếp gấp đáy ${env.tuckSlit.depth} mm`],
  [
    "Khe hở khi bỏ thiệp",
    `rộng thừa ${env.bodyWidth - card.width} mm, cao thừa ${env.bodyHeight - card.height} mm`,
  ],
  ["Tràn màu", `${bleed} mm ngoài đường cắt`],
];

export function PrintSizes() {
  return (
    <table className="w-full text-left text-xs">
      <caption className="sr-only">Kích thước bộ in</caption>
      <tbody>
        {ROWS.map(([name, value]) => (
          <tr key={name} className="border-b last:border-0">
            <th scope="row" className="py-1.5 pr-3 align-top font-medium whitespace-nowrap">
              {name}
            </th>
            <td className="py-1.5 text-muted-foreground">{value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export const CARD_SIZE_LABEL = mm(card.width, card.height);
export const ENVELOPE_SIZE_LABEL = mm(env.bodyWidth, env.bodyHeight);
