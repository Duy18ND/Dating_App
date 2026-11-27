/** Hướng dẫn in và lắp ráp. Chỉ nằm trên web, không in lên giấy. */
export function PrintGuide() {
  return (
    <div className="space-y-2 text-xs text-muted-foreground">
      <p>
        <strong>Hai file, hai loại giấy A4.</strong> Giấy văn phòng mỏng (70–80 gsm) chỉ để in
        nháp. Xem máy in nhận tối đa bao nhiêu gsm; giấy dày thường phải nạp khay tay. Luôn in tỉ
        lệ 100%, không chọn &quot;Vừa trang&quot;, và chọn đúng loại giấy trong hộp thoại in. Bản
        in không có chữ hướng dẫn, các bước ở đây:
      </p>
      <p className="font-medium text-foreground">Phong bì (120–160 gsm, in 1 mặt)</p>
      <ol className="list-decimal space-y-0.5 pl-5">
        <li>Cắt theo nét liền (chỗ có hình cây kéo), kể cả khe cong nhỏ.</li>
        <li>Miết nhẹ theo nét đứt bằng bút hết mực để nếp gấp thẳng.</li>
        <li>Mặt có màu quay ra ngoài: gấp hai tai bên trước.</li>
        <li>Bôi keo vào ô gạch chéo trên hai tai bên rồi gấp nắp dưới lên, ép chặt.</li>
      </ol>
      <p className="font-medium text-foreground">Thiệp (bìa 230–300 gsm, in 2 mặt)</p>
      <ol className="list-decimal space-y-0.5 pl-5">
        <li>
          Chọn <strong>in 2 mặt, lật theo cạnh dài</strong>. Máy không tự đảo được giấy dày: in
          trang 1, đặt lại tờ giấy rồi in trang 2 (thử bằng giấy nháp trước để biết chiều nạp).
        </li>
        <li>Cắt theo 4 dấu góc nhìn từ mặt trước, được tấm thiệp in 2 mặt.</li>
        <li>Bỏ thiệp vào phong bì, gấp nắp trên xuống và cài tai vào khe.</li>
      </ol>
    </div>
  );
}
