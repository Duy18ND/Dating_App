import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PreviewSandbox } from "@/components/viewer/PreviewSandbox";
import { buildPreviewLetter, resolvePreviewTemplate } from "@/lib/preview-samples";
import { sanitizeRecipient } from "@/lib/recipient";

interface PageProps {
  params: Promise<{ mau: string }>;
  searchParams: Promise<{ to?: string | string[] }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { mau } = await params;
  const type = resolvePreviewTemplate(mau);
  if (!type) return { title: "Không tìm thấy mẫu xem thử" };
  const letter = buildPreviewLetter(type);
  return {
    title: `Xem thử: ${letter.title} · Phygital Letter Studio`,
    description: "Trang xem thử trải nghiệm mở phong bì và lướt đọc trang web bày tỏ.",
  };
}

export default async function PreviewTemplatePage({ params, searchParams }: PageProps) {
  const { mau } = await params;
  const type = resolvePreviewTemplate(mau);
  if (!type) notFound();

  const { to } = await searchParams;
  const recipient = sanitizeRecipient(Array.isArray(to) ? to[0] : to);
  const letter = buildPreviewLetter(type);

  return <PreviewSandbox letter={letter} templateType={type} recipient={recipient} />;
}
