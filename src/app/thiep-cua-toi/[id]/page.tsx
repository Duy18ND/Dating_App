import type { Metadata } from "next";
import { Suspense } from "react";
import { LetterDetail } from "@/components/account/LetterDetail";

export const metadata: Metadata = {
  title: "Chi tiết thiệp | Phygital Letter Studio",
  robots: { index: false, follow: false },
};

export default function LetterDetailPage(props: PageProps<"/thiep-cua-toi/[id]">) {
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8">
      <Suspense fallback={<p className="text-muted-foreground">Đang tải...</p>}>
        <Detail {...props} />
      </Suspense>
    </main>
  );
}

async function Detail({ params }: PageProps<"/thiep-cua-toi/[id]">) {
  const { id } = await params;
  return <LetterDetail id={id} />;
}
