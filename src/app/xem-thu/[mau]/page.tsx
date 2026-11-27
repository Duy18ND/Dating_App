import { CuteLoader } from "@/components/cute/CuteLoader";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PreviewSandbox } from "@/components/viewer/PreviewSandbox";
import { buildPreviewLetter, resolvePreviewTemplate } from "@/lib/preview-samples";
import { sanitizeRecipient } from "@/lib/recipient";
import { TEMPLATE_TYPES } from "@/types/letter";

// 4 mẫu biết trước lúc build: dựng sẵn khung tĩnh, chỉ phần đọc ?to= chạy lúc có request.
export function generateStaticParams() {
  return TEMPLATE_TYPES.map((mau) => ({ mau }));
}

export async function generateMetadata({ params }: PageProps<"/xem-thu/[mau]">): Promise<Metadata> {
  const { mau } = await params;
  const type = resolvePreviewTemplate(mau);
  if (!type) return { title: "Không tìm thấy mẫu xem thử" };
  const letter = buildPreviewLetter(type);
  return {
    title: `Xem thử: ${letter.title} · Phygital Letter Studio`,
    description: "Trang xem thử trải nghiệm mở phong bì và lướt đọc trang web bày tỏ.",
  };
}

export default function PreviewTemplatePage(props: PageProps<"/xem-thu/[mau]">) {
  return (
    <Suspense fallback={<CuteLoader label="Đang mở thư..." />}>
      <Preview {...props} />
    </Suspense>
  );
}

async function Preview({ params, searchParams }: PageProps<"/xem-thu/[mau]">) {
  const [{ mau }, query] = await Promise.all([params, searchParams]);
  const type = resolvePreviewTemplate(mau);
  if (!type) notFound();

  const recipient = sanitizeRecipient(query.to);
  const letter = buildPreviewLetter(type);
  // key: đổi mẫu thì làm mới phong cách đang chọn, không mang theo phong cách của mẫu trước.
  return <PreviewSandbox key={type} letter={letter} templateType={type} recipient={recipient} />;
}
