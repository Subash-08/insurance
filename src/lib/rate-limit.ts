import { NextRequest, NextResponse } from "next/server";

interface RateLimitEntry {
  count: number;
  resetAt: number;
  burstCount: number;
  burstResetAt: number;
}

// In-memory store — NOTE: Single-instance only. Resets on restart.
// Not suitable for multi-instance/Vercel deployments. Future: migrate to Upstash Redis.
const store = new Map<string, RateLimitEntry>();
const concurrencyMap = new Map<string, boolean>(); // For heavy endpoint semaphore

function getStore(key: string): RateLimitEntry {
  const now = Date.now();
  let entry = store.get(key);
  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + 60_000, burstCount: 0, burstResetAt: now + 5_000 };
    store.set(key, entry);
  }
  // Reset burst window if expired
  if (now > entry.burstResetAt) {
    entry.burstCount = 0;
    entry.burstResetAt = now + 5_000;
  }
  return entry;
}

/** Public routes — IP-based: 20 req/min, burst: 10 req/5s */
export function rateLimitPublic(req: NextRequest): NextResponse | null {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  const ua = req.headers.get("user-agent") ?? "";

  // Basic bot protection — empty or known crawler agents
  if (!ua || /bot|crawler|spider|wget|curl/i.test(ua)) {
    return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
  }

  const entry = getStore(`pub:${ip}`);
  entry.count++;
  entry.burstCount++;

  if (entry.burstCount > 10) {
    return NextResponse.json({ success: false, message: "Too many requests" }, { status: 429 });
  }
  if (entry.count > 20) {
    return NextResponse.json({ success: false, message: "Rate limit exceeded" }, { status: 429 });
  }
  return null;
}

/** Authenticated normal routes — userId-based: 200 req/min */
export function rateLimitAuth(userId: string): NextResponse | null {
  const entry = getStore(`auth:${userId}`);
  entry.count++;
  if (entry.count > 200) {
    return NextResponse.json({ success: false, message: "Too many requests" }, { status: 429 });
  }
  return null;
}

/** Heavy endpoints (export, reports) — userId: 5 req/min, max 1 concurrent */
export function rateLimitHeavy(userId: string): { response: NextResponse | null; release: () => void } {
  const entry = getStore(`heavy:${userId}`);
  entry.count++;

  if (entry.count > 5) {
    return {
      response: NextResponse.json(
        { success: false, message: "Export rate limit exceeded. Try again in a minute." },
        { status: 429 }
      ),
      release: () => {},
    };
  }

  if (concurrencyMap.get(userId)) {
    return {
      response: NextResponse.json(
        { success: false, message: "Another export is already in progress. Please wait." },
        { status: 429 }
      ),
      release: () => {},
    };
  }

  concurrencyMap.set(userId, true);
  return {
    response: null,
    release: () => concurrencyMap.delete(userId),
  };
}

// Cleanup old entries every 5 minutes to prevent memory leak
setInterval(() => {
  const now = Date.now();
  store.forEach((entry, key) => {
    if (now > entry.resetAt) store.delete(key);
  });
}, 5 * 60 * 1000);

/** Special rate limit for forgot-password: max 3 requests per hour per email */
export async function checkEmailRateLimit(email: string): Promise<{ limited: boolean }> {
  const key = `pwd_reset:${email.toLowerCase()}`;
  const now = Date.now();
  let entry = store.get(key);
  
  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + 3600_000, burstCount: 0, burstResetAt: now };
    store.set(key, entry);
  }
  
  entry.count++;
  if (entry.count > 3) {
    return { limited: true };
  }
  
  return { limited: false };
}
