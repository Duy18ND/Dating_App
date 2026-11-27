"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { getManagedLetter } from "@/lib/client/api";
import { useEditorStore } from "@/lib/editor/store";
import { createFromTemplate, findTemplate } from "@/lib/templates";
import { EditorShell } from "./EditorShell";

/**
 * ?template=<loại>: bắt đầu từ mẫu. ?edit=<editToken>: mở lại thư đã xuất bản để sửa;
 * lần lưu sau cập nhật đúng thư đó nên mã QR đã in vẫn dùng được.
 */
export function EditorLoader() {
  const query = useSearchParams();
  const editToken = query.get("edit");
  const template = findTemplate(query.get("template"))?.type ?? "confession";
  const key = editToken ? `edit:${editToken}` : `template:${template}`;
  const [loaded, setLoaded] = useState<{ key: string; error?: string }>();

  useEffect(() => {
    let active = true;
    const done = (error?: string) => active && setLoaded({ key, error });
    const { load } = useEditorStore.getState();
    const task = editToken
      ? getManagedLetter(editToken).then((letter) => {
          if (!active) return;
          const { template_type, title, canvas_data, web_config } = letter;
          load({ template_type, title, canvas_data, web_config }, { slug: letter.slug, editToken });
        })
      : Promise.resolve().then(() => active && load(createFromTemplate(template)));
    task.then(
      () => done(),
      (cause: Error) => done(cause.message),
    );
    return () => {
      active = false;
    };
  }, [key, editToken, template]);

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
