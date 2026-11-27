interface TurnstileApi {
  render(container: HTMLElement, options: Record<string, unknown>): string;
  remove(widgetId: string): void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

let loading: Promise<TurnstileApi> | undefined;

function loadScript(): Promise<TurnstileApi> {
  loading ??= new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.onload = () => resolve(window.turnstile!);
    script.onerror = () => {
      loading = undefined;
      script.remove();
      reject(new Error("Không tải được xác thực chống spam. Kiểm tra mạng rồi thử lại."));
    };
    document.head.append(script);
  });
  return loading;
}

/** Token chỉ dùng được một lần nên mỗi request lấy token mới. Không có site key thì bỏ qua. */
export async function getTurnstileToken(): Promise<string | null> {
  const sitekey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  if (!sitekey) return null;
  const turnstile = await loadScript();
  const container = document.createElement("div");
  container.className = "fixed right-4 bottom-4 z-[100]";
  document.body.append(container);
  let widgetId: string | undefined;
  try {
    return await new Promise<string>((resolve, reject) => {
      const fail = () => reject(new Error("Xác thực chống spam thất bại, hãy thử lại."));
      widgetId = turnstile.render(container, {
        sitekey,
        appearance: "interaction-only",
        callback: resolve,
        "error-callback": fail,
        "timeout-callback": fail,
      });
    });
  } finally {
    if (widgetId) turnstile.remove(widgetId);
    container.remove();
  }
}
