import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Chính sách riêng tư | Phygital Letter Studio",
  description: "Dữ liệu Phygital Letter Studio lưu, thời gian lưu và cách xóa.",
};

function Part({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="space-y-2 text-sm leading-relaxed">{children}</div>
    </section>
  );
}

// Nội dung phải khớp với code: bảng letters/responses/uploads/rate_events, cron 60 ngày,
// cookie phiên Supabase, IP chỉ lưu dạng băm. Sửa code lưu dữ liệu thì sửa cả trang này.
export default function PrivacyPage() {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 space-y-8 px-4 py-10">
      <header className="space-y-2">
        <Link href="/" className="font-playfair text-lg text-primary">
          Phygital Letter Studio
        </Link>
        <h1 className="font-playfair text-3xl">Chính sách riêng tư</h1>
        <p className="text-sm text-muted-foreground">
          Trang này nói rõ chúng tôi lưu gì, lưu bao lâu và bạn xóa thế nào.
        </p>
      </header>

      <Part title="1. Dữ liệu chúng tôi lưu">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Tài khoản người tạo thiệp:</strong> email và mật khẩu (mật khẩu do Supabase
            Auth lưu dạng băm, chúng tôi không đọc được), hoặc thông tin cơ bản từ Google nếu bạn
            đăng nhập bằng Google.
          </li>
          <li>
            <strong>Nội dung thiệp:</strong> chữ, thiết kế, tên người gửi và người nhận, nhạc đã
            chọn, các phần của trang web.
          </li>
          <li>
            <strong>Ảnh bạn tải lên:</strong> lưu trên Cloudflare R2. Ai có link thiệp đều xem
            được ảnh trong thiệp đó.
          </li>
          <li>
            <strong>Phản hồi của người nhận:</strong> câu trả lời Đồng ý, xác nhận tham dự, bình
            chọn, tên và lời chúc họ tự nhập. Người nhận không cần tài khoản.
          </li>
          <li>
            <strong>Địa chỉ IP:</strong> chỉ lưu dạng mã băm một chiều để chống spam (giới hạn số
            thiệp, số ảnh, số phản hồi). Sổ đếm chống spam được xóa sau 48 giờ.
          </li>
          <li>
            <strong>Số lượt mở thiệp:</strong> chỉ là con số, không kèm thông tin người mở.
          </li>
        </ul>
      </Part>

      <Part title="2. Thời gian lưu">
        <p>
          Mỗi thiệp tự hết hạn và bị xóa sau <strong>60 ngày</strong> kể từ ngày tạo, cùng toàn bộ
          phản hồi. Ảnh của thiệp bị xóa khỏi kho ảnh trong lần dọn dẹp tự động kế tiếp (mỗi ngày
          một lần). Sau thời điểm đó, <strong>mã QR trên thiệp giấy ngừng hoạt động</strong>.
        </p>
        <p>
          Chúng tôi không có chức năng tải bản lưu. Nếu muốn giữ kỷ niệm, hãy quay màn hình khi mở
          thiệp trước ngày hết hạn.
        </p>
        <p>Tài khoản của bạn được giữ cho tới khi bạn xóa, không bị xóa theo thiệp.</p>
      </Part>

      <Part title="3. Cách xóa">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            Xóa một thiệp: vào <Link href="/thiep-cua-toi" className="text-primary underline">Thiệp
            của tôi</Link>, chọn thiệp rồi bấm Xóa. Thiệp và phản hồi bị xóa ngay; ảnh bị xóa trong
            lần dọn dẹp kế tiếp.
          </li>
          <li>
            Xóa tài khoản: trong Thiệp của tôi, mục Tài khoản. Toàn bộ thiệp và phản hồi bị xóa
            ngay; ảnh bị xóa trong lần dọn dẹp kế tiếp.
          </li>
        </ul>
      </Part>

      <Part title="4. Cookie">
        <p>
          Chúng tôi chỉ dùng cookie để giữ bạn đăng nhập. Không có cookie quảng cáo hay theo dõi.
          Người nhận thiệp không bị đặt cookie đăng nhập.
        </p>
      </Part>

      <Part title="5. Bên xử lý dữ liệu">
        <p>
          Supabase (cơ sở dữ liệu và đăng nhập), Cloudflare (kho ảnh, nhạc và chống spam
          Turnstile), Vercel (máy chủ web), Google (chỉ khi bạn chọn đăng nhập bằng Google). Chúng
          tôi không bán hay chia sẻ dữ liệu cho bên nào khác.
        </p>
      </Part>

      <Part title="6. Trách nhiệm với nội dung">
        <p>
          Bạn chịu trách nhiệm với chữ và ảnh mình đưa lên. Đừng đưa thông tin nhạy cảm của người
          khác vào thiệp, vì ai có link hoặc quét mã QR đều xem được.
        </p>
      </Part>
    </main>
  );
}
