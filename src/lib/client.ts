export type ApiResult<T> =
  | { ok: true; data: T; status: number }
  | { ok: false; status: number; error: string; errors: Record<string, string> };

/** fetch + JSON for the app's own API. Never throws; failures come back as { ok: false }. */
export async function api<T = unknown>(url: string, init: { method?: string; body?: unknown } = {}): Promise<ApiResult<T>> {
  try {
    const res = await fetch(url, {
      method: init.method ?? (init.body === undefined ? "GET" : "POST"),
      headers: init.body === undefined ? undefined : { "Content-Type": "application/json" },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) return { ok: true, data: data as T, status: res.status };
    return {
      ok: false,
      status: res.status,
      error: data.error ?? "কিছু একটা সমস্যা হয়েছে।",
      errors: data.errors ?? {},
    };
  } catch {
    return { ok: false, status: 0, error: "ইন্টারনেট সংযোগ পরীক্ষা করুন।", errors: {} };
  }
}
