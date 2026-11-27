import { ChevronDown, FileText, Printer, Ruler, Scissors, ShoppingBag } from "lucide-react";
import type { ComponentType, ReactNode } from "react";
import { PrintSizes } from "./PrintSizes";

/** Một mục thu gọn được, để hướng dẫn dài không đẩy phần xem trước đi quá xa. */
function Topic({
  icon: Icon,
  title,
  open,
  children,
}: {
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  title: string;
  open?: boolean;
  children: ReactNode;
}) {
  return (
    <details open={open} className="group rounded-lg border bg-card">
      <summary className="flex min-h-10 cursor-pointer list-none items-center gap-2 px-3 py-2 text-sm font-medium [&::-webkit-details-marker]:hidden">
        <Icon aria-hidden className="size-4 shrink-0 text-primary" />
        <span className="flex-1">{title}</span>
        <ChevronDown
          aria-hidden
          className="size-4 shrink-0 transition-transform group-open:rotate-180"
        />
      </summary>
      <div className="space-y-2 border-t px-3 py-2.5 text-xs leading-relaxed text-muted-foreground">
        {children}
      </div>
    </details>
  );
}

const Name = ({ children }: { children: ReactNode }) => (
  <strong className="text-foreground">{children}</strong>
);

/**
 * Mua gì, in thế nào, lắp ra sao. Chỉ nằm trên web, không in lên giấy.
 * Bề rộng băng keo (≤ 5 mm) lấy theo vùng dán trên phôi: chỗ hẹp nhất khoảng 4,5 mm.
 */
export function PrintGuide() {
  return (
    <div className="space-y-2">
      <Topic icon={Ruler} title="Kích thước">
        <PrintSizes />
      </Topic>

      <Topic icon={FileText} title="Chọn giấy">
        <p>
          Cả bộ in trên <Name>1 tờ A4, hai mặt</Name>. Hãy chọn giấy <Name>180–200 gsm</Name>: đủ
          cứng cho thiệp mà vẫn gấp được phong bì.
        </p>
        <ul className="list-disc space-y-1 pl-4">
          <li>
            Ra tiệm văn phòng phẩm hoặc tiệm in, hỏi{" "}
            <Name>“giấy bìa A4 định lượng 180 hoặc 200 gsm, in được hai mặt”</Name>. Loại bề mặt mờ,
            màu trắng hoặc trắng ngà là dễ đẹp nhất.
          </li>
          <li>
            Mua đúng loại cho máy của bạn: bao bì ghi <Name>dùng cho in phun</Name> hoặc{" "}
            <Name>dùng cho in laser</Name>. Máy in phun nên tránh giấy bóng không ghi dành cho in
            phun, vì mực dễ lem.
          </li>
          <li>
            Muốn in lên giấy Kraft hoặc giấy màu thì bật “Ẩn nền”. Máy in nhà thường không in được
            màu trắng, và hãy quét thử mã QR trên giấy sẫm.
          </li>
          <li>Mua thêm vài tờ A4 thường (70–80 gsm) để in nháp.</li>
        </ul>
      </Topic>

      <Topic icon={ShoppingBag} title="Mua keo, kéo và dụng cụ">
        <ul className="list-disc space-y-1 pl-4">
          <li>
            <Name>Keo:</Name> băng keo hai mặt loại mỏng <Name>rộng tối đa 5 mm</Name> (sạch và dính
            ngay), hoặc <Name>keo khô dạng thỏi</Name>. Tránh keo sữa, keo nước vì giấy dễ nhăn.
          </li>
          <li>
            <Name>Kéo:</Name> kéo văn phòng nhỏ, mũi nhọn, để cắt đường cong quanh nắp phong bì.
          </li>
          <li>
            <Name>Dao rọc giấy:</Name> cần có để rạch khe cài ở giữa nắp dưới, kéo không cắt gọn
            được. Cắt thiệp bằng dao và thước cũng thẳng hơn.
          </li>
          <li>
            <Name>Thước kẻ</Name> (thước kim loại càng tốt) và một miếng bìa cứng lót dưới khi rạch.
          </li>
          <li>
            <Name>Bút bi hết mực:</Name> để miết đường gấp.
          </li>
          <li>Không bắt buộc: sticker hoặc sáp niêm phong để trang trí nắp.</li>
        </ul>
        <p>Khi dùng dao, đẩy lưỡi vừa đủ và để tay giữ thước ngoài đường lưỡi dao đi.</p>
      </Topic>

      <Topic icon={Printer} title="Cách in">
        <ul className="list-disc space-y-1 pl-4">
          <li>
            File PDF có 2 trang là <Name>hai mặt của cùng một tờ</Name>. Chọn{" "}
            <Name>in 2 mặt, lật theo cạnh dài</Name>.
          </li>
          <li>
            Tỉ lệ <Name>100%</Name> (hoặc “Kích thước thực”), không chọn “Vừa trang”. Chọn đúng loại
            giấy dày hoặc bìa trong hộp thoại in.
          </li>
          <li>
            Xem máy in nhận tối đa bao nhiêu gsm. Nhiều máy không tự đảo mặt được giấy dày: in
            trang 1, đặt lại tờ giấy rồi in trang 2. Máy không nhận giấy dày thì mang file ra tiệm
            in.
          </li>
          <li>
            <Name>In nháp bằng giấy thường trước:</Name> soi lên đèn xem hai mặt thiệp có trùng
            không, và để biết chiều nạp giấy.
          </li>
        </ul>
      </Topic>

      <Topic icon={Scissors} title="Cắt, gấp, dán" open>
        <p>Bản in không có chữ hướng dẫn. Làm theo các bước, nhìn từ trang 1:</p>
        <ol className="list-decimal space-y-1 pl-4">
          <li>Cắt phong bì theo nét liền (chỗ có hình cây kéo).</li>
          <li>Rạch khe cong nhỏ trên nắp dưới bằng dao rọc giấy.</li>
          <li>Cắt thiệp theo 4 dấu góc, được tấm thiệp in hai mặt.</li>
          <li>Đặt thước theo từng nét đứt, miết bằng bút hết mực rồi mới gấp.</li>
          <li>Để mặt có màu quay ra ngoài, gấp hai tai bên vào trước.</li>
          <li>
            Dán keo vào <Name>ô gạch chéo</Name> trên hai tai bên, gấp nắp dưới lên và ép chặt.
          </li>
          <li>Bỏ thiệp vào, gấp nắp trên xuống và cài tai vào khe.</li>
        </ol>
      </Topic>
    </div>
  );
}
