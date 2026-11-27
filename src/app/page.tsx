import Link from "next/link";
import { TemplatePreview } from "@/components/home/TemplatePreview";
import { buttonVariants } from "@/components/ui/button";
import { TEMPLATES } from "@/lib/templates";

const STEPS = [
  ["Thiết kế", "Chọn mẫu A6, thêm chữ, ảnh, sticker và nhạc nền. Không cần đăng nhập."],
  ["In và gói", "Tải PDF gồm thiệp A6 hoặc A5 và phôi phong bì C6, in trên giấy A4."],
  ["Mở thư", "Người nhận quét mã QR trên thiệp để bóc dấu sáp, nghe nhạc và trả lời bạn."],
] as const;

export default function Home() {
  return (
    <main className="flex-1">
      <section className="mx-auto max-w-3xl px-4 pt-16 pb-12 text-center">
        <h1 className="font-playfair text-4xl leading-tight text-primary sm:text-5xl">
          Thư giấy cầm trên tay, lời nhắn sống trên màn hình
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground">
          Tự thiết kế tấm thiệp A6, in ra giấy và gửi kèm mã QR mở thư có nhạc. Miễn phí.
        </p>
        <Link href="#mau-thu" className={buttonVariants({ size: "lg", className: "mt-8 h-11 px-6" })}>
          Chọn mẫu để bắt đầu
        </Link>
      </section>

      <section id="mau-thu" className="mx-auto max-w-6xl scroll-mt-6 px-4 py-8">
        <h2 className="text-2xl font-semibold">Bốn mẫu thiệp A6</h2>
        <ul className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {TEMPLATES.map((template) => (
            <li key={template.type}>
              <Link
                href={`/editor?template=${template.type}`}
                className="block h-full rounded-lg border bg-card p-3 transition-colors hover:border-primary focus-visible:ring-3 focus-visible:ring-ring"
              >
                <TemplatePreview type={template.type} />
                <h3 className="mt-3 font-semibold">{template.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{template.description}</p>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <ol className="grid gap-6 sm:grid-cols-3">
          {STEPS.map(([title, body], index) => (
            <li key={title} className="border-t pt-4">
              <h3 className="font-semibold">
                {index + 1}. {title}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">{body}</p>
            </li>
          ))}
        </ol>
        <p className="mt-10 text-center text-sm text-muted-foreground">
          Thư được lưu 60 ngày. Bạn tự chịu trách nhiệm với ảnh cá nhân mình tải lên.
        </p>
      </section>
    </main>
  );
}
