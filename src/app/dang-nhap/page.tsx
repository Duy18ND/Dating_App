import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AuthForm } from "@/components/account/AuthForm";

export const metadata: Metadata = {
  title: "Đăng nhập | Phygital Letter Studio",
  robots: { index: false, follow: true },
};

export default function LoginPage() {
  return (
    <main className="mx-auto w-full max-w-sm flex-1 px-4 py-10">
      <Link href="/" className="mb-8 block text-center font-playfair text-lg text-primary">
        Phygital Letter Studio
      </Link>
      <Suspense fallback={<p className="text-center text-muted-foreground">Đang tải...</p>}>
        <AuthForm />
      </Suspense>
    </main>
  );
}
