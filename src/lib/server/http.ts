import { connection } from "next/server";

/** Throw from a route handler; `handle` turns it into a JSON response. */
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public errors?: Record<string, string>,
  ) {
    super(message);
  }
}

export async function handle(fn: () => Promise<Response> | Response): Promise<Response> {
  // Every API route reads live data. Saying so up front (outside the try) lets Next.js's
  // prerender bail-out propagate instead of being caught below as a server error.
  await connection();
  try {
    return await fn();
  } catch (error) {
    if (error instanceof HttpError) {
      return Response.json({ error: error.message, errors: error.errors }, { status: error.status });
    }
    console.error(error);
    return Response.json({ error: "সার্ভারে সমস্যা হয়েছে।" }, { status: 500 });
  }
}

export async function readJson(request: Request): Promise<Record<string, unknown>> {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) throw new HttpError(400, "Invalid JSON body");
  return body as Record<string, unknown>;
}

export function clientIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0].trim() || request.headers.get("x-real-ip") || "local";
}

// Fixed-window counters, per process. Enough to slow down scraping and PIN guessing.
const g = globalThis as typeof globalThis & { __raktobondhuLimits?: Map<string, { count: number; resetAt: number }> };
const buckets = (g.__raktobondhuLimits ??= new Map());

export function rateLimit(key: string, limit: number, windowMs: number, message = "অনেকবার চেষ্টা করা হয়েছে, কিছুক্ষণ পরে আবার চেষ্টা করুন।") {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }
  if (++bucket.count > limit) throw new HttpError(429, message);
}

export function clearRateLimit(key: string) {
  buckets.delete(key);
}
