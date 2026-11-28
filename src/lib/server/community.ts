import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { requireEnv } from "./env";

function db(): SupabaseClient {
  const url = process.env.SUPABASE_URL || requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  return createClient(url, requireEnv("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export interface SiteReview {
  id: string;
  author_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

export interface CommunityOverview {
  visits: number;
  users: number;
  letters: number;
  reviewCount: number;
  averageRating: number;
  reviews: SiteReview[];
  reviewsReady: boolean;
}

function isMissingTable(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  const msg = error.message ?? "";
  return (
    error.code === "42P01" ||
    error.code === "PGRST205" ||
    error.code === "42883" ||
    msg.includes("does not exist") ||
    msg.includes("Could not find the")
  );
}

/** Đếm số tài khoản đã đăng ký trong Supabase Auth (không lộ email/dữ liệu cá nhân). */
async function countAuthUsers(client: SupabaseClient): Promise<number> {
  try {
    const res = await client.auth.admin.listUsers({ page: 1, perPage: 1 });
    if (res.error) return 0;
    const total = (res.data as { total?: number; users?: unknown[] } | null)?.total;
    if (typeof total === "number" && Number.isFinite(total)) return total;
    return res.data?.users?.length ?? 0;
  } catch {
    return 0;
  }
}

export async function getCommunityOverview(): Promise<CommunityOverview> {
  const client = db();

  const [users, lettersRes, metricRes, reviewsRes] = await Promise.all([
    countAuthUsers(client),
    client.from("letters").select("view_count", { count: "exact" }).limit(2000),
    client.from("site_metrics").select("count").eq("key", "visits").maybeSingle(),
    client
      .from("site_reviews")
      .select("id, author_name, rating, comment, created_at", { count: "exact" })
      .order("created_at", { ascending: false })
      .limit(24),
  ]);

  const letters = lettersRes.count ?? lettersRes.data?.length ?? 0;
  const letterViews = (lettersRes.data ?? []).reduce(
    (sum, row) => sum + (typeof row.view_count === "number" ? row.view_count : 0),
    0,
  );
  const siteVisits =
    !metricRes.error && typeof metricRes.data?.count === "number" ? metricRes.data.count : 0;

  let reviewsReady = true;
  let reviews: SiteReview[] = [];
  let reviewCount = 0;
  let averageRating = 0;

  if (reviewsRes.error) {
    if (isMissingTable(reviewsRes.error)) {
      reviewsReady = false;
    } else {
      throw new Error(`Supabase: ${reviewsRes.error.message}`);
    }
  } else {
    reviews = (reviewsRes.data ?? []) as SiteReview[];
    reviewCount = reviewsRes.count ?? reviews.length;
    if (reviews.length > 0) {
      const avg = reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length;
      averageRating = Math.round(avg * 10) / 10;
    }
  }

  return {
    visits: siteVisits + letterViews,
    users,
    letters,
    reviewCount,
    averageRating,
    reviews,
    reviewsReady,
  };
}

export async function recordSiteVisit(): Promise<number | null> {
  const { data, error } = await db().rpc("increment_site_visits");
  if (error) {
    if (isMissingTable(error)) return null;
    throw new Error(`Supabase: ${error.message}`);
  }
  return typeof data === "number" ? data : null;
}

export async function createSiteReview(input: {
  author_name: string;
  rating: number;
  comment: string;
  ip_hash: string;
}): Promise<SiteReview> {
  const { data, error } = await db()
    .from("site_reviews")
    .insert(input)
    .select("id, author_name, rating, comment, created_at")
    .single();
  if (error) {
    if (isMissingTable(error)) {
      throw new Error("Bảng đánh giá đang chờ khởi tạo trên database (chạy migration 0004).");
    }
    throw new Error(`Supabase: ${error.message}`);
  }
  return data as SiteReview;
}
