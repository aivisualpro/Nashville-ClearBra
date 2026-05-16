import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Middleware: rate-limiting (in-memory for dev, use Upstash in production)
 * and CSRF protection for state-changing requests.
 */

// ─── Simple in-memory rate limiter ──────────────────────────────────────────
// In production, replace with Upstash Ratelimit or Cloudflare rate limiting.
const rateMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 100; // requests per window
const RATE_WINDOW_MS = 60_000; // 1 minute

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }

  entry.count++;
  if (entry.count > RATE_LIMIT) {
    return true;
  }
  return false;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Rate limiting on API routes ────────────────────────────────────
  if (pathname.startsWith("/api/") && !pathname.startsWith("/api/auth/")) {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";

    if (isRateLimited(ip)) {
      return NextResponse.json(
        { success: false, message: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }
  }

  // ── CSRF protection for state-changing API requests ────────────────
  const mutatingMethods = ["POST", "PUT", "PATCH", "DELETE"];
  if (
    pathname.startsWith("/api/") &&
    !pathname.startsWith("/api/auth/") &&
    mutatingMethods.includes(request.method)
  ) {
    const origin = request.headers.get("origin");
    const host = request.headers.get("host");

    // Allow requests with no origin (server-side, same-origin form submissions)
    if (origin) {
      const originUrl = new URL(origin);
      if (originUrl.host !== host) {
        return NextResponse.json(
          { success: false, message: "CSRF validation failed" },
          { status: 403 }
        );
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};
