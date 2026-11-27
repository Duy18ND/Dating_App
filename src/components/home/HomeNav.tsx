"use client";

import { Heart } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { SignOutButton } from "@/components/account/SignOutButton";
import { buttonVariants } from "@/components/ui/button";
import { authBrowser } from "@/lib/supabase/browser";

/**
 * Nút tài khoản ở trang chủ. Chỉ để chọn nút cần hiện nên đọc phiên tại trình duyệt;
 * quyền thật do server kiểm tra.
 */
export function HomeNav() {
  const [signedIn, setSignedIn] = useState<boolean>();

  useEffect(() => {
    try {
      const { data } = authBrowser().auth.onAuthStateChange((_event, session) =>
        setSignedIn(Boolean(session)),
      );
      return () => data.subscription.unsubscribe();
    } catch {
      // Chưa cấu hình Supabase: coi như chưa đăng nhập.
      queueMicrotask(() => setSignedIn(false));
    }
  }, []);

  const button = (variant: "default" | "ghost") =>
    buttonVariants({ variant, size: "sm", className: "anim-pop h-9 px-3" });

  return (
    <nav
      aria-label="Tài khoản"
      className="mx-auto flex min-h-14 max-w-6xl items-center justify-between gap-2 px-4 pt-2"
    >
      <Link href="/" className="group flex items-center gap-1.5 font-playfair text-primary">
        <Heart aria-hidden className="wiggle-on-hover size-4 shrink-0 fill-current" />
        <span className="text-base whitespace-nowrap sm:text-lg">Phygital Letter</span>
      </Link>
      {/* Chưa biết trạng thái thì chưa hiện nút, thanh vẫn giữ nguyên chiều cao. */}
      <div className="flex items-center gap-1 sm:gap-2">
        {signedIn === true && (
          <>
            <Link href="/thiep-cua-toi" className={button("default")}>
              Thiệp của tôi
            </Link>
            {/* Điện thoại không đủ chỗ: đăng xuất nằm trong Thiệp của tôi. */}
            <span className="hidden sm:inline-flex">
              <SignOutButton />
            </span>
          </>
        )}
        {signedIn === false && (
          <>
            <Link href="/dang-nhap" className={button("ghost")}>
              Đăng nhập
            </Link>
            <Link href="/dang-nhap?che-do=dang-ky" className={button("default")}>
              Đăng ký
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
