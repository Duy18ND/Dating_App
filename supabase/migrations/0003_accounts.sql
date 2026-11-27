-- v1.4 (T-38): người tạo thiệp bắt buộc đăng nhập. Chạy sau 0002.
-- Không tự xóa dữ liệu: nếu database thử đã có thư, người vận hành tự xóa trước
--   DELETE FROM letters; DELETE FROM uploads;
-- vì thư cũ không có chủ và cột owner_id là NOT NULL (câu lệnh dưới sẽ báo lỗi và dừng).

ALTER TABLE letters
  ADD COLUMN owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE INDEX idx_letters_owner ON letters(owner_id, created_at DESC);

-- Link quản lý bí mật được thay bằng tài khoản.
ALTER TABLE letters DROP COLUMN edit_token;

-- Ảnh thuộc về người tải lên; xóa tài khoản thì ảnh thành vô chủ để cron dọn.
ALTER TABLE uploads
  ADD COLUMN owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
CREATE INDEX idx_uploads_owner ON uploads(owner_id);

-- Chỉ gắn được ảnh do chính chủ thư tải lên, chưa thuộc thư nào khác.
CREATE OR REPLACE FUNCTION set_letter_uploads(p_letter_id UUID, p_urls TEXT[])
RETURNS BOOLEAN LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
  claimable INT;
  letter_owner UUID;
BEGIN
  SELECT owner_id INTO letter_owner FROM letters WHERE id = p_letter_id;
  IF letter_owner IS NULL THEN RETURN FALSE; END IF;
  PERFORM 1 FROM uploads WHERE url = ANY(p_urls) FOR UPDATE;
  SELECT count(*) INTO claimable FROM uploads
   WHERE url = ANY(p_urls)
     AND owner_id = letter_owner
     AND (letter_id IS NULL OR letter_id = p_letter_id);
  IF claimable <> cardinality(p_urls) THEN RETURN FALSE; END IF;
  UPDATE uploads SET letter_id = NULL, orphaned_at = NOW()
   WHERE letter_id = p_letter_id AND NOT (url = ANY(p_urls));
  UPDATE uploads SET letter_id = p_letter_id, orphaned_at = NULL WHERE url = ANY(p_urls);
  RETURN TRUE;
END $$;

REVOKE EXECUTE ON FUNCTION set_letter_uploads(UUID, TEXT[]) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION set_letter_uploads(UUID, TEXT[]) TO service_role;
