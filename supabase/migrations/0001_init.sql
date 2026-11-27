-- Chạy trong Supabase SQL Editor (T-02). Chỉ server (service_role) được đọc/ghi.

CREATE TABLE letters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(12) UNIQUE NOT NULL,
  edit_token VARCHAR(32) UNIQUE NOT NULL,
  template_type VARCHAR(20) NOT NULL CHECK (template_type IN ('confession','wedding','dinner','holiday')),
  title VARCHAR(120),
  canvas_data JSONB NOT NULL,
  web_config JSONB NOT NULL,
  view_count INT NOT NULL DEFAULT 0,
  creator_ip_hash VARCHAR(64),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '60 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- slug đã có index nhờ UNIQUE.
CREATE INDEX idx_letters_expires_at ON letters(expires_at);

CREATE TABLE responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  letter_id UUID NOT NULL REFERENCES letters(id) ON DELETE CASCADE,
  responder_name VARCHAR(100),
  action_type VARCHAR(20) NOT NULL CHECK (action_type IN ('accept','rsvp','poll')),
  status VARCHAR(30),
  guest_count INT DEFAULT 1 CHECK (guest_count BETWEEN 0 AND 20),
  poll_option VARCHAR(120),
  message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_responses_letter_id ON responses(letter_id);

-- Ảnh đã tải lên. letter_id NULL = chưa gắn thư nào (cron sẽ dọn).
CREATE TABLE uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  object_key VARCHAR(200) UNIQUE NOT NULL,
  url VARCHAR(500) UNIQUE NOT NULL,
  ip_hash VARCHAR(64),
  letter_id UUID REFERENCES letters(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_uploads_letter_id ON uploads(letter_id);
CREATE INDEX idx_uploads_orphan ON uploads(created_at) WHERE letter_id IS NULL;

CREATE TABLE rate_events (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  bucket VARCHAR(200) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_rate_events_bucket ON rate_events(bucket, created_at);

-- Đếm và ghi trong một transaction, có khóa theo bucket để request song song không lách được.
CREATE FUNCTION consume_rate_limit(p_bucket TEXT, p_max INT, p_window_seconds INT)
RETURNS BOOLEAN LANGUAGE plpgsql SET search_path = public AS $$
DECLARE used INT;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext(p_bucket));
  SELECT count(*) INTO used FROM rate_events
   WHERE bucket = p_bucket AND created_at > clock_timestamp() - make_interval(secs => p_window_seconds);
  IF used >= p_max THEN RETURN FALSE; END IF;
  INSERT INTO rate_events(bucket, created_at) VALUES (p_bucket, clock_timestamp());
  RETURN TRUE;
END $$;

CREATE FUNCTION register_view(p_slug TEXT)
RETURNS VOID LANGUAGE sql SET search_path = public AS $$
  UPDATE letters SET view_count = view_count + 1 WHERE slug = p_slug AND expires_at > NOW();
$$;

-- Gắn đúng tập ảnh cho một thư. Trả FALSE nếu có URL lạ hoặc đang thuộc thư khác.
CREATE FUNCTION set_letter_uploads(p_letter_id UUID, p_urls TEXT[])
RETURNS BOOLEAN LANGUAGE plpgsql SET search_path = public AS $$
DECLARE claimable INT;
BEGIN
  PERFORM 1 FROM uploads WHERE url = ANY(p_urls) FOR UPDATE;
  SELECT count(*) INTO claimable FROM uploads
   WHERE url = ANY(p_urls) AND (letter_id IS NULL OR letter_id = p_letter_id);
  IF claimable <> cardinality(p_urls) THEN RETURN FALSE; END IF;
  UPDATE uploads SET letter_id = NULL WHERE letter_id = p_letter_id AND NOT (url = ANY(p_urls));
  UPDATE uploads SET letter_id = p_letter_id WHERE url = ANY(p_urls);
  RETURN TRUE;
END $$;

-- Lấy ra (và xóa) ảnh mồ côi cũ hơn p_hours giờ, để server xóa file trên R2.
CREATE FUNCTION take_orphan_uploads(p_hours INT, p_limit INT)
RETURNS SETOF uploads LANGUAGE sql SET search_path = public AS $$
  DELETE FROM uploads WHERE id IN (
    SELECT id FROM uploads
     WHERE letter_id IS NULL AND created_at < NOW() - make_interval(hours => p_hours)
     ORDER BY created_at LIMIT p_limit FOR UPDATE SKIP LOCKED
  ) RETURNING *;
$$;

ALTER TABLE letters ENABLE ROW LEVEL SECURITY;
ALTER TABLE responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_events ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON letters, responses, uploads, rate_events FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION
  consume_rate_limit(TEXT, INT, INT), register_view(TEXT),
  set_letter_uploads(UUID, TEXT[]), take_orphan_uploads(INT, INT)
FROM PUBLIC, anon, authenticated;
GRANT ALL ON letters, responses, uploads, rate_events TO service_role;
GRANT EXECUTE ON FUNCTION
  consume_rate_limit(TEXT, INT, INT), register_view(TEXT),
  set_letter_uploads(UUID, TEXT[]), take_orphan_uploads(INT, INT)
TO service_role;
