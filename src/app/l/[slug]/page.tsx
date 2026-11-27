import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { LetterContent } from "@/components/viewer/LetterContent";
import { sanitizeRecipient } from "@/lib/recipient";
import { ApiError } from "@/lib/server/http";
import { getActiveLetter, toPublicLetter } from "@/lib/server/letters";

export default function LetterPage(props: PageProps<"/l/[slug]">) {
  return (
    <Suspense fallback={<p className="p-8 text-center text-muted-foreground">Đang mở thư...</p>}>
      <Letter {...props} />
    </Suspense>
  );
}

async function Letter({ params, searchParams }: PageProps<"/l/[slug]">) {
  // Hạn của thư phải kiểm tra theo giờ lúc có người mở, không phải lúc build.
  await connection();
  const [{ slug }, query] = await Promise.all([params, searchParams]);

  let row;
  try {
    row = await getActiveLetter(slug);
  } catch (error) {
    if (!(error instanceof ApiError)) throw error;
    return (
      <main className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-xl font-semibold">{error.message}</h1>
        <Link href="/" className="mt-4 inline-block text-primary underline">
          Làm một lá thư mới
        </Link>
      </main>
    );
  }

  // toPublicLetter loại edit_token trước khi dữ liệu sang trình duyệt.
  // TODO(T-20): bọc phong bì, phát nhạc và gọi recordView khi bóc dấu sáp.
  return <LetterContent letter={toPublicLetter(row)} recipient={sanitizeRecipient(query.to)} />;
}
