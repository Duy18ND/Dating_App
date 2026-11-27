const SAMPLE = "Gửi người thương: những kỷ niệm ngọt ngào, đẹp đẽ nhất — Ặ Ễ Ỗ Ữ Ỵ";

const SAMPLES = [
  ["Be Vietnam Pro", "font-sans"],
  ["Cormorant Garamond", "font-cormorant"],
  ["Playfair Display", "font-playfair"],
  ["Charm", "font-charm"],
  ["Dancing Script", "font-dancing"],
  ["Mali", "font-mali"],
] as const;

// Trang tạm để kiểm tra dấu tiếng Việt (T-01). T-17 sẽ thay bằng trang chủ.
export default function Home() {
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-12">
      <h1 className="font-playfair text-3xl text-primary">Phygital Letter Studio</h1>
      <ul className="mt-8 space-y-4">
        {SAMPLES.map(([name, className]) => (
          <li key={name} className="rounded-lg border bg-card p-4">
            <p className="text-sm text-muted-foreground">{name}</p>
            <p className={`${className} mt-1 text-2xl`}>{SAMPLE}</p>
          </li>
        ))}
      </ul>
    </main>
  );
}
