-- Chạy sau 0001_init.sql (Supabase SQL Editor).
-- Ảnh mồ côi phải được tính hạn từ lúc bị gỡ khỏi thư, không phải lúc tải lên.
-- Trước đây: gỡ một ảnh cũ khỏi thư rồi lưu, cron đêm đó xóa file ngay; nếu người dùng
-- hoàn tác và lưu lại thì ảnh đã mất.

ALTER TABLE uploads ADD COLUMN orphaned_at TIMESTAMPTZ;

CREATE OR REPLACE FUNCTION set_letter_uploads(p_letter_id UUID, p_urls TEXT[])
RETURNS BOOLEAN LANGUAGE plpgsql SET search_path = public AS $$
DECLARE claimable INT;
BEGIN
  PERFORM 1 FROM uploads WHERE url = ANY(p_urls) FOR UPDATE;
  SELECT count(*) INTO claimable FROM uploads
   WHERE url = ANY(p_urls) AND (letter_id IS NULL OR letter_id = p_letter_id);
  IF claimable <> cardinality(p_urls) THEN RETURN FALSE; END IF;
  UPDATE uploads SET letter_id = NULL, orphaned_at = NOW()
   WHERE letter_id = p_letter_id AND NOT (url = ANY(p_urls));
  UPDATE uploads SET letter_id = p_letter_id, orphaned_at = NULL WHERE url = ANY(p_urls);
  RETURN TRUE;
END $$;

-- Ảnh của thư hết hạn bị gỡ qua ON DELETE SET NULL nên orphaned_at vẫn NULL:
-- khi đó dùng created_at (đã cũ) để xóa ngay trong lần chạy đó.
CREATE OR REPLACE FUNCTION take_orphan_uploads(p_hours INT, p_limit INT)
RETURNS SETOF uploads LANGUAGE sql SET search_path = public AS $$
  DELETE FROM uploads WHERE id IN (
    SELECT id FROM uploads
     WHERE letter_id IS NULL
       AND COALESCE(orphaned_at, created_at) < NOW() - make_interval(hours => p_hours)
     ORDER BY created_at LIMIT p_limit FOR UPDATE SKIP LOCKED
  ) RETURNING *;
$$;

REVOKE EXECUTE ON FUNCTION set_letter_uploads(UUID, TEXT[]), take_orphan_uploads(INT, INT)
FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION set_letter_uploads(UUID, TEXT[]), take_orphan_uploads(INT, INT)
TO service_role;
