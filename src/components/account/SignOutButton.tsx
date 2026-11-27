"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { authBrowser } from "@/lib/supabase/browser";

export function SignOutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        await authBrowser().auth.signOut();
        router.replace("/");
        router.refresh();
      }}
    >
      <LogOut /> Đăng xuất
    </Button>
  );
}
