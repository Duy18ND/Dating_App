/** Hướng dẫn in và lắp ráp. Chỉ nằm trên web, không in lên giấy. */
export function PrintGuide() {
  return (
    <div className="space-y-1.5 text-xs text-muted-foreground">
      <p>
        PDF 2 trang là <strong>2 mặt của 1 tờ A4</strong> (giấy 180–220gsm). Chọn{" "}
        <strong>in 2 mặt, lật theo cạnh dài</strong>, đúng 100%, không chọn &quot;Vừa trang&quot;.
        Máy in 1 mặt: in trang 1, đặt lại tờ giấy rồi in trang 2 lên mặt trắng (nên thử bằng giấy
        thường trước để biết chiều nạp giấy). Bản in không có chữ hướng dẫn, các bước ở đây:
      </p>
      <ol className="list-decimal space-y-0.5 pl-5">
        <li>Cắt nhìn từ trang 1: theo nét liền (chỗ có hình cây kéo), kể cả khe cong nhỏ.</li>
        <li>Thiệp: cắt theo 4 dấu góc, được tấm thiệp in 2 mặt.</li>
        <li>Gấp phong bì theo nét đứt, mặt có màu quay ra ngoài: hai tai bên trước.</li>
        <li>Bôi keo vào ô gạch chéo trên hai tai bên rồi gấp nắp dưới lên, ép chặt.</li>
        <li>Bỏ thiệp vào, gấp nắp trên xuống và cài tai vào khe.</li>
      </ol>
    </div>
  );
}
