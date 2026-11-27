import Link from "next/link";
import { CuteEnvelope } from "@/components/cute/CuteEnvelope";
import { FloatingHearts } from "@/components/cute/FloatingHearts";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="relative flex min-h-dvh flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <FloatingHearts />
      <CuteEnvelope className="anim-float" />
      <h1 className="anim-rise font-playfair text-3xl text-primary">Lá thư này đi lạc rồi</h1>
      <p className="anim-rise max-w-sm text-muted-foreground">
        Không tìm thấy trang bạn cần. Hãy kiểm tra lại đường link nhé.
      </p>
      <Link href="/" className={buttonVariants({ className: "anim-pop relative h-11 px-6" })}>
        Về trang chủ
      </Link>
    </main>
  );
}
