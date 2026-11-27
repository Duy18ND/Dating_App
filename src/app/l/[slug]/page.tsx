import { CuteLoader } from "@/components/cute/CuteLoader";
import type { Metadata } from "next";
import Link from "next/link";
import { CuteEnvelope } from "@/components/cute/CuteEnvelope";
import { connection } from "next/server";
import { cache, Suspense } from "react";
import { LetterExperience } from "@/components/viewer/LetterExperience";
import { sanitizeRecipient } from "@/lib/recipient";
import { ApiError } from "@/lib/server/http";
import { getActiveLetter, toPublicLetter } from "@/lib/server/letters";

// Metadata và trang cùng cần một lá thư: chỉ đọc database một lần mỗi request.
const loadLetter = cache(getActiveLetter);

export async function generateMetadata({
  params,
  searchParams,
}: PageProps<"/l/[slug]">): Promise<Metadata> {
  await connection();
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const recipient = sanitizeRecipient(query.to);
  // Chỉ lộ tên người gửi, không lộ nội dung để giữ bất ngờ khi mở thư.
  const sender = await loadLetter(slug).then(
    (row) => row.web_config.senderName.trim(),
    () => "",
  );
  const title = recipient ? `${recipient} ơi, bạn có một lá thư` : "Bạn có một lá thư";
  const description = sender
    ? `${sender} gửi cho bạn. Chạm để mở thư.`
    : "Chạm để bóc dấu sáp và mở thư.";
  return {
    title,
    description,
    // openGraph ở trang con thay thế toàn bộ của layout, nên phải khai lại ảnh.
    openGraph: {
      title,
      description,
      locale: "vi_VN",
      type: "website",
      images: [{ url: "/opengraph-image.png", width: 1200, height: 630 }],
    },
    // Thư riêng tư: không đưa lên công cụ tìm kiếm.
    robots: { index: false, follow: false },
  };
}

export default function LetterPage(props: PageProps<"/l/[slug]">) {
  return (
    <Suspense fallback={<CuteLoader label="Đang mở thư..." />}>
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
    row = await loadLetter(slug);
  } catch (error) {
    if (!(error instanceof ApiError)) throw error;
    return (
      <main className="mx-auto flex max-w-md flex-col items-center px-4 py-16 text-center">
        <CuteEnvelope className="anim-float mb-4" />
        <h1 className="text-xl font-semibold">{error.message}</h1>
        <Link href="/" className="mt-4 inline-block text-primary underline">
          Làm một lá thư mới
        </Link>
      </main>
    );
  }

  // toPublicLetter loại owner_id trước khi dữ liệu sang trình duyệt.
  return <LetterExperience letter={toPublicLetter(row)} recipient={sanitizeRecipient(query.to)} />;
}
