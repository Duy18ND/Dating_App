import { Heart, MailOpen, Palette, Scissors } from "lucide-react";
import Link from "next/link";
import type { CSSProperties } from "react";
import { CuteEnvelope } from "@/components/cute/CuteEnvelope";
import { FloatingHearts } from "@/components/cute/FloatingHearts";
import { HomeNav } from "@/components/home/HomeNav";
import { TemplatePreview } from "@/components/home/TemplatePreview";
import { buttonVariants } from "@/components/ui/button";
import { TEMPLATES } from "@/lib/templates";

const STEPS = [
  {
    icon: Palette,
    title: "Thiết kế",
    body: "Đăng nhập, chọn mẫu, trang trí thiệp và trang web, thêm nhạc nền. Người nhận không cần tài khoản.",
  },
  {
    icon: Scissors,
    title: "In và cắt dán",
    body: "Tải 2 file PDF: phong bì mini và tấm thiệp 2 mặt có mã QR, mỗi thứ in trên loại giấy hợp với nó. Cắt, gấp, dán.",
  },
  {
    icon: MailOpen,
    title: "Mở thư",
    body: "Người nhận quét mã QR trên thiệp để bóc dấu sáp, nghe nhạc và trả lời bạn.",
  },
];

/** Độ trễ để các phần hiện lần lượt. */
const after = (ms: number) => ({ "--delay": `${ms}ms` }) as CSSProperties;

export default function Home() {
  return (
    <main className="flex-1 overflow-x-clip">
      <HomeNav />
      <section className="relative mx-auto max-w-3xl px-4 pt-6 pb-12 text-center">
        <FloatingHearts />
        <div className="anim-pop mx-auto w-fit">
          <CuteEnvelope className="anim-float w-36 sm:w-44" />
        </div>
        <h1
          className="anim-rise relative mt-4 font-playfair text-4xl leading-tight text-balance text-primary sm:text-5xl"
          style={after(80)}
        >
          Thư giấy cầm trên tay, lời nhắn sống trên màn hình
        </h1>
        <p
          className="anim-rise relative mx-auto mt-5 max-w-xl text-lg text-muted-foreground"
          style={after(160)}
        >
          Tự thiết kế bộ thiệp mini nhỏ xinh, in ra cắt dán, viết tay vài dòng và gửi kèm mã QR mở
          thư có nhạc. Miễn phí.
        </p>
        <div className="anim-rise relative mt-8" style={after(240)}>
          <Link
            href="#mau-thu"
            className={buttonVariants({ size: "lg", className: "group h-11 gap-2 px-6" })}
          >
            <Heart aria-hidden className="wiggle-on-hover fill-current" />
            Chọn mẫu để bắt đầu
          </Link>
        </div>
      </section>

      <section id="mau-thu" className="mx-auto max-w-6xl scroll-mt-6 px-4 py-8">
        <h2 className="text-2xl font-semibold">Bốn mẫu thiệp mini</h2>
        <ul className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {TEMPLATES.map((template, index) => (
            <li key={template.type} className="anim-rise" style={after(300 + index * 90)}>
              <Link
                href={`/editor?template=${template.type}`}
                className="lift block h-full rounded-2xl border bg-card p-3 hover:border-primary focus-visible:ring-3 focus-visible:ring-ring"
                // Nghiêng xen kẽ khi rê chuột, như thiệp đặt trên bàn.
                style={{ "--tilt": index % 2 === 0 ? "-1.2deg" : "1.2deg" } as CSSProperties}
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
        <ol className="grid gap-4 sm:grid-cols-3">
          {STEPS.map(({ icon: Icon, title, body }, index) => (
            <li key={title} className="anim-reveal">
              <div className="lift group h-full rounded-2xl border bg-card p-5">
                <span className="flex size-11 items-center justify-center rounded-full bg-accent text-primary">
                  <Icon aria-hidden className="wiggle-on-hover size-5" />
                </span>
                <h3 className="mt-3 font-semibold">
                  {index + 1}. {title}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">{body}</p>
              </div>
            </li>
          ))}
        </ol>
        <p className="mt-10 text-center text-sm text-muted-foreground">
          Mỗi thiệp được lưu 60 ngày, sau đó <strong>mã QR trên thiệp giấy ngừng hoạt động</strong>.
          Bạn tự chịu trách nhiệm với ảnh cá nhân mình tải lên.{" "}
          <Link href="/chinh-sach-rieng-tu" className="underline">
            Chính sách riêng tư
          </Link>
        </p>
      </section>
    </main>
  );
}
