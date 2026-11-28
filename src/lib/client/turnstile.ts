interface TurnstileApi {
  render(container: HTMLElement, options: Record<string, unknown>): string;
  remove(widgetId: string): void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const TURNSTILE_TIMEOUT_MS = 20_000;

let loading: Promise<TurnstileApi> | undefined;

function loadScript(): Promise<TurnstileApi> {
  if (typeof window !== "undefined" && window.turnstile) {
    return Promise.resolve(window.turnstile);
  }
  loading ??= new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.onload = () => {
      if (window.turnstile) {
        resolve(window.turnstile);
      } else {
        loading = undefined;
        script.remove();
        reject(new Error("Không tải được xác thực chống spam. Kiểm tra mạng rồi thử lại."));
      }
    };
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
  let timer: number | undefined;
  try {
    return await new Promise<string>((resolve, reject) => {
      let settled = false;
      const done = (token: string) => {
        if (settled) return;
        settled = true;
        resolve(token);
      };
      const fail = (message = "Xác thực chống spam thất bại, hãy thử lại.") => {
        if (settled) return;
        settled = true;
        reject(new Error(message));
      };
      timer = window.setTimeout(
        () => fail("Xác thực chống spam quá lâu, hãy kiểm tra mạng rồi thử lại."),
        TURNSTILE_TIMEOUT_MS,
      );
      widgetId = turnstile.render(container, {
        sitekey,
        appearance: "interaction-only",
        callback: done,
        "error-callback": () => fail(),
        "expired-callback": () => fail(),
        "timeout-callback": () => fail("Xác thực chống spam quá lâu, hãy thử lại."),
      });
    });
  } finally {
    if (timer !== undefined) window.clearTimeout(timer);
    if (widgetId) turnstile.remove(widgetId);
    container.remove();
  }
}
