import { NextResponse, type NextRequest } from "next/server";
import { extractClientIp, isIpBanned, enforceRateLimit, banIp, isLocalOrDev } from "@/lib/compression/rate-limit";

// Suspicious patterns commonly used by malicious scanners/bots
const SUSPICIOUS_PATH_PATTERNS = [
  /\/\.\./, // Directory traversal /..
  /\/\.(env|git|svn|htaccess)/i, // Sensitive configuration files
  /\/(wp-login|wp-admin|xmlrpc|phpmyadmin|eval-stdin)/i, // Common CMS attack vectors
  /%2e%2e/i // Encoded directory traversal
];

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const ip = extractClientIp(request);

  // 1. In local development or for localhost, allow all traffic smoothly
  if (isLocalOrDev(ip)) {
    const response = NextResponse.next();
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("X-Frame-Options", "DENY");
    return response;
  }

  // 2. Exploit / scanner defense (blocks malicious probe paths in production)
  for (const pattern of SUSPICIOUS_PATH_PATTERNS) {
    if (pattern.test(pathname)) {
      const banSeconds = banIp(ip);
      return NextResponse.json(
        {
          error: {
            code: "FORBIDDEN",
            message: `Malicious request pattern blocked. IP temporarily banned for ${banSeconds}s.`
          }
        },
        { status: 403 }
      );
    }
  }

  // 3. Rate limiting and ban enforcement strictly for /api/* routes
  if (pathname.startsWith("/api/")) {
    const banStatus = isIpBanned(ip);
    if (banStatus.banned) {
      return NextResponse.json(
        {
          error: {
            code: "IP_BANNED",
            message: `Your IP address is temporarily blocked for ${banStatus.remainingSeconds}s due to high request volume.`
          }
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(banStatus.remainingSeconds),
            "Content-Type": "application/json"
          }
        }
      );
    }

    try {
      enforceRateLimit(`mw_api:${ip}`, 100, 60_000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Too many requests.";
      return NextResponse.json(
        { error: { code: "RATE_LIMITED", message } },
        { status: 429, headers: { "Retry-After": "60" } }
      );
    }
  }

  // 4. Continue with security headers injected
  const response = NextResponse.next();
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  response.headers.set("X-XSS-Protection", "1; mode=block");

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public assets like /images/*
     */
    "/((?!_next/static|_next/image|favicon.ico|images/).*)"
  ]
};
