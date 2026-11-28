-- 0004: Thống kê lượt truy cập trang chủ và đánh giá từ người dùng.
-- Chạy trong Supabase SQL Editor. Chỉ server (service_role) được đọc/ghi.

CREATE TABLE IF NOT EXISTS site_metrics (
  key VARCHAR(40) PRIMARY KEY,
  count BIGINT NOT NULL DEFAULT 0
);

INSERT INTO site_metrics (key, count)
VALUES ('visits', 0)
ON CONFLICT (key) DO NOTHING;

CREATE TABLE IF NOT EXISTS site_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_name VARCHAR(60) NOT NULL,
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT NOT NULL,
  ip_hash VARCHAR(64),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_site_reviews_created_at ON site_reviews(created_at DESC);

CREATE OR REPLACE FUNCTION increment_site_visits()
RETURNS BIGINT LANGUAGE sql SET search_path = public AS $$
  INSERT INTO site_metrics (key, count) VALUES ('visits', 1)
  ON CONFLICT (key) DO UPDATE SET count = site_metrics.count + 1
  RETURNING count;
$$;

ALTER TABLE site_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_reviews ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON site_metrics, site_reviews FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION increment_site_visits() FROM PUBLIC, anon, authenticated;

GRANT ALL ON site_metrics, site_reviews TO service_role;
GRANT EXECUTE ON FUNCTION increment_site_visits() TO service_role;
