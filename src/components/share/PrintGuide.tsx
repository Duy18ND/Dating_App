/** Hướng dẫn in và lắp ráp. Chỉ nằm trên web, không in lên giấy (v1.7). */
export function PrintGuide() {
  return (
    <div className="space-y-1.5 text-xs text-muted-foreground">
      <p>
        PDF chỉ 1 trang A4, in 1 mặt (giấy 180–220gsm), đúng 100%, không chọn &quot;Vừa
        trang&quot;. Bản in không có chữ hướng dẫn, các bước ở đây:
      </p>
      <ol className="list-decimal space-y-0.5 pl-5">
        <li>Cắt theo nét liền (chỗ có hình cây kéo), kể cả khe cong nhỏ trên nắp dưới.</li>
        <li>Thiệp: cắt theo 4 dấu góc. Mặt sau để trắng, bạn viết tay lời nhắn ở đó.</li>
        <li>Gấp theo nét đứt: hai tai bên vào trước, rồi nắp dưới lên.</li>
        <li>Bôi keo vào ô gạch chéo trên hai tai bên rồi ép nắp dưới lên.</li>
        <li>Bỏ thiệp vào, gấp nắp trên xuống và cài tai vào khe.</li>
      </ol>
    </div>
  );
}
