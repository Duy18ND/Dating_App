"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { getMyLetter } from "@/lib/client/api";
import { useEditorStore } from "@/lib/editor/store";
import { createFromTemplate, findTemplate } from "@/lib/templates";
import { EditorShell } from "./EditorShell";

/**
 * ?template=<loại>: bắt đầu từ mẫu. ?id=<id thiệp>: mở lại thiệp của chính mình để sửa;
 * lần lưu sau cập nhật đúng thiệp đó (giữ slug) nên mã QR đã in vẫn dùng được.
 */
export function EditorLoader() {
  const query = useSearchParams();
  const letterId = query.get("id");
  const template = findTemplate(query.get("template"))?.type ?? "confession";
  const key = letterId ? `id:${letterId}` : `template:${template}`;
  const [loaded, setLoaded] = useState<{ key: string; error?: string }>();

  useEffect(() => {
    let active = true;
    const done = (error?: string) => active && setLoaded({ key, error });
    const { load } = useEditorStore.getState();
    const task = letterId
      ? getMyLetter(letterId).then((letter) => {
          if (!active) return;
          const { template_type, title, canvas_data, web_config } = letter;
          load({ template_type, title, canvas_data, web_config }, { id: letter.id, slug: letter.slug });
        })
      : Promise.resolve().then(() => active && load(createFromTemplate(template)));
    task.then(
      () => done(),
      (cause: Error) => done(cause.message),
    );
    return () => {
      active = false;
    };
  }, [key, letterId, template]);

  if (loaded?.key !== key) {
    return <p className="p-8 text-center text-muted-foreground">Đang mở trình thiết kế...</p>;
  }
  if (loaded.error) {
    return (
      <main className="mx-auto max-w-md space-y-4 px-4 py-16 text-center">
        <p role="alert">{loaded.error}</p>
        <Link href="/" className="text-primary underline">
          Về trang chủ
        </Link>
      </main>
    );
  }
  return <EditorShell />;
}
