"use client";

import { Eye, MessageSquareHeart, Send, Star, Users } from "lucide-react";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { inputClass } from "@/components/editor/ui";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface PublicSiteReview {
  id: string;
  author_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

interface CommunityState {
  loaded: boolean;
  visits: number;
  users: number;
  letters: number;
  reviewCount: number;
  averageRating: number;
  reviews: PublicSiteReview[];
  reviewsReady: boolean;
  addReview: (review: PublicSiteReview) => void;
}

const INITIAL: CommunityState = {
  loaded: false,
  visits: 0,
  users: 0,
  letters: 0,
  reviewCount: 0,
  averageRating: 0,
  reviews: [],
  reviewsReady: true,
  addReview: () => {},
};

const CommunityContext = createContext<CommunityState>(INITIAL);

const fmtNum = (n: number) => new Intl.NumberFormat("vi-VN").format(n);
const fmtDate = (iso: string) => {
  try {
    return new Date(iso).toLocaleDateString("vi-VN");
  } catch {
    return "";
  }
};

/** Tải 1 lần số liệu cộng đồng (truy cập, tài khoản, đánh giá) & ghi nhận lượt truy cập theo phiên. */
export function CommunityProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<Omit<CommunityState, "addReview">>({
    loaded: false,
    visits: 0,
    users: 0,
    letters: 0,
    reviewCount: 0,
    averageRating: 0,
    reviews: [],
    reviewsReady: true,
  });

  useEffect(() => {
    let active = true;
    const visitKey = "thunho:visited-session";
    const trackVisit = async () => {
      try {
        if (!window.sessionStorage.getItem(visitKey)) {
          window.sessionStorage.setItem(visitKey, "1");
          await fetch("/api/community/visit", { method: "POST", credentials: "same-origin" });
        }
      } catch {
        // Không làm ảnh hưởng trải nghiệm nếu trình duyệt chặn storage/network.
      }
    };

    void trackVisit().then(async () => {
      try {
        const res = await fetch("/api/community", { credentials: "same-origin" });
        if (!res.ok) return;
        const json = (await res.json()) as Omit<CommunityState, "loaded" | "addReview">;
        if (active) setData({ ...json, loaded: true });
      } catch {
        if (active) setData((prev) => ({ ...prev, loaded: true }));
      }
    });

    return () => {
      active = false;
    };
  }, []);

  const addReview = (review: PublicSiteReview) => {
    setData((prev) => {
      const nextReviews = [review, ...prev.reviews].slice(0, 24);
      const nextCount = prev.reviewCount + 1;
      const totalStars = prev.averageRating * prev.reviewCount + review.rating;
      const nextAvg = Math.round((totalStars / nextCount) * 10) / 10;
      return {
        ...prev,
        reviews: nextReviews,
        reviewCount: nextCount,
        averageRating: nextAvg,
      };
    });
  };

  return (
    <CommunityContext.Provider value={{ ...data, addReview }}>{children}</CommunityContext.Provider>
  );
}

/** Dải thống kê thật nổi bật ngay dưới Hero: Lượt truy cập · Tài khoản đã tạo · Đánh giá. */
export function CommunityStatsBar() {
  const { loaded, visits, users, reviewCount, averageRating } = useContext(CommunityContext);

  const ratingLabel =
    reviewCount > 0 ? `${averageRating.toFixed(1)} ★ (${fmtNum(reviewCount)})` : "Chưa có đánh giá";

  return (
    <section aria-label="Thống kê Thư Nhỏ" className="mx-auto max-w-3xl px-4 pb-6">
      <div className="grid grid-cols-3 divide-x rounded-2xl border bg-card/90 shadow-xs backdrop-blur-xs">
        <div className="flex flex-col items-center gap-0.5 px-2 py-3.5 text-center sm:px-4">
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground sm:text-xs">
            <Eye className="size-3.5 text-primary" /> Truy cập
          </span>
          <strong className="text-lg font-semibold tabular-nums sm:text-2xl">
            {loaded ? fmtNum(visits) : "—"}
          </strong>
        </div>
        <div className="flex flex-col items-center gap-0.5 px-2 py-3.5 text-center sm:px-4">
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground sm:text-xs">
            <Users className="size-3.5 text-primary" /> Tài khoản
          </span>
          <strong className="text-lg font-semibold tabular-nums sm:text-2xl">
            {loaded ? fmtNum(users) : "—"}
          </strong>
        </div>
        <a
          href="#danh-gia"
          className="flex flex-col items-center gap-0.5 px-2 py-3.5 text-center transition-colors hover:bg-accent/50 sm:px-4"
        >
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground sm:text-xs">
            <Star className="size-3.5 fill-amber-400 text-amber-500" /> Đánh giá
          </span>
          <strong className="text-sm font-semibold tabular-nums sm:text-xl">
            {loaded ? ratingLabel : "—"}
          </strong>
        </a>
      </div>
    </section>
  );
}

/** Khu vực đánh giá web: danh sách đánh giá + form chấm sao viết nhận xét ngay trên trang chủ. */
export function CommunityReviews() {
  const { reviews, reviewCount, averageRating, reviewsReady, addReview } =
    useContext(CommunityContext);
  const [name, setName] = useState("");
  const [rating, setRating] = useState(5);
  const [hoverStar, setHoverStar] = useState(0);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string>();

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(undefined);
    try {
      const res = await fetch("/api/community/reviews", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          author_name: name.trim(),
          rating,
          comment: comment.trim(),
        }),
      });
      const body = (await res.json().catch(() => ({}))) as PublicSiteReview & { error?: string };
      if (!res.ok) throw new Error(body.error ?? "Chưa gửi được đánh giá, hãy thử lại.");
      addReview(body);
      setName("");
      setComment("");
      setRating(5);
      setSent(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Chưa gửi được đánh giá.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section id="danh-gia" className="mx-auto max-w-6xl scroll-mt-6 px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h2 className="inline-flex items-center gap-2 text-2xl font-semibold">
            <MessageSquareHeart className="size-6 text-primary" /> Đánh giá từ mọi người
          </h2>
          <p className="text-sm text-muted-foreground">
            Chia sẻ cảm nhận sau khi làm thiệp để tụi mình cải thiện Thư Nhỏ mỗi ngày nhé.
          </p>
        </div>
        {reviewCount > 0 && (
          <div className="inline-flex items-center gap-2 rounded-full border bg-card px-4 py-1.5 text-sm font-medium shadow-xs">
            <Star className="size-4 fill-amber-400 text-amber-500" />
            <span>{averageRating.toFixed(1)} / 5</span>
            <span className="text-muted-foreground">({fmtNum(reviewCount)} đánh giá)</span>
          </div>
        )}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-12">
        {/* Form gửi đánh giá */}
        <div className="lg:col-span-5">
          <form
            onSubmit={submit}
            className="space-y-3 rounded-2xl border bg-card p-5 shadow-xs"
          >
            <h3 className="font-semibold">Gửi đánh giá của bạn</h3>
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Bạn chấm mấy sao?</p>
              <div className="flex items-center gap-1" role="radiogroup" aria-label="Số sao đánh giá">
                {[1, 2, 3, 4, 5].map((star) => {
                  const active = (hoverStar || rating) >= star;
                  return (
                    <button
                      key={star}
                      type="button"
                      role="radio"
                      aria-checked={rating === star}
                      aria-label={`${star} sao`}
                      onMouseEnter={() => setHoverStar(star)}
                      onMouseLeave={() => setHoverStar(0)}
                      onClick={() => setRating(star)}
                      className="rounded-md p-1 transition-transform hover:scale-110 focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <Star
                        className={cn(
                          "size-6 transition-colors",
                          active
                            ? "fill-amber-400 text-amber-500"
                            : "text-muted-foreground/40",
                        )}
                      />
                    </button>
                  );
                })}
              </div>
            </div>
            <input
              className={inputClass}
              aria-label="Tên của bạn"
              placeholder="Tên của bạn (VD: Minh Anh)"
              required
              maxLength={60}
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                setSent(false);
              }}
            />
            <textarea
              className={inputClass}
              aria-label="Cảm nhận về Thư Nhỏ"
              placeholder="Viết vài dòng cảm nhận về web nhé..."
              required
              minLength={3}
              maxLength={400}
              rows={3}
              value={comment}
              onChange={(event) => {
                setComment(event.target.value);
                setSent(false);
              }}
            />
            {error && (
              <p role="alert" className="text-xs text-destructive">
                {error}
              </p>
            )}
            {sent && (
              <p role="status" className="text-xs font-medium text-primary">
                Cảm ơn bạn đã gửi đánh giá yêu thương! 💌
              </p>
            )}
            <Button
              type="submit"
              disabled={busy || !reviewsReady || !name.trim() || comment.trim().length < 3}
              className="w-full"
            >
              <Send className="size-4" />
              {busy ? "Đang gửi..." : "Gửi đánh giá"}
            </Button>
          </form>
        </div>

        {/* Danh sách đánh giá */}
        <div className="lg:col-span-7">
          {reviews.length === 0 ? (
            <div className="flex h-full min-h-48 flex-col items-center justify-center rounded-2xl border border-dashed bg-card/60 p-6 text-center text-sm text-muted-foreground">
              <Star className="mb-2 size-7 text-amber-400" />
              <p className="font-medium text-foreground">Chưa có đánh giá nào</p>
              <p className="mt-1">Hãy là người đầu tiên chấm sao cho Thư Nhỏ nhé!</p>
            </div>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {reviews.slice(0, 6).map((review) => (
                <li
                  key={review.id}
                  className="flex flex-col justify-between gap-2.5 rounded-2xl border bg-card p-4 shadow-xs"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-semibold">{review.author_name}</span>
                      <span className="inline-flex shrink-0 items-center gap-0.5" aria-label={`${review.rating} sao`}>
                        {Array.from({ length: 5 }, (_, i) => (
                          <Star
                            key={i}
                            className={cn(
                              "size-3.5",
                              i < review.rating
                                ? "fill-amber-400 text-amber-500"
                                : "text-muted-foreground/30",
                            )}
                          />
                        ))}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed whitespace-pre-line text-foreground/90">
                      “{review.comment}”
                    </p>
                  </div>
                  <p className="text-[11px] text-muted-foreground">{fmtDate(review.created_at)}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
