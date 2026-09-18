export class RateLimitError extends Error {
  constructor(message: string, public code = "RATE_LIMITED", public status = 429) {
    super(message);
    this.name = "RateLimitError";
  }
}

type Bucket = { count: number; resetAt: number };
type BanRecord = { bannedUntil: number; strikeCount: number };

const buckets = new Map<string, Bucket>();
const bannedIps = new Map<string, BanRecord>();

const FLOOD_THRESHOLD = 120; // 120 requests in 1 minute triggers auto-ban
const BASE_BAN_DURATION_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Extract real client IP securely, prioritizing trusted proxy headers.
 */
export function extractClientIp(request: Request): string {
  const headers = request.headers;

  // 1. Cloudflare header
  const cfIp = headers.get("cf-connecting-ip");
  if (cfIp && isValidIp(cfIp.trim())) return cfIp.trim();

  // 2. Caddy / Nginx reverse proxy header
  const realIp = headers.get("x-real-ip");
  if (realIp && isValidIp(realIp.trim())) return realIp.trim();

  // 3. X-Forwarded-For header (first non-internal IP or first entry)
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const parts = forwarded.split(",").map((p) => p.trim()).filter(Boolean);
    if (parts.length > 0 && isValidIp(parts[0])) {
      return parts[0];
    }
  }

  // 4. Fallback: anonymous fingerprint from user-agent if local
  const ua = headers.get("user-agent") || "unknown";
  return `local:${hashString(ua).slice(0, 8)}`;
}

export function clientKey(request: Request): string {
  return extractClientIp(request);
}

function isValidIp(ip: string): boolean {
  // Basic IPv4 / IPv6 validation
  const ipv4 = /^(\d{1,3}\.){3}\d{1,3}$/;
  const ipv6 = /^[0-9a-fA-F:]+$/;
  return ipv4.test(ip) || ipv6.test(ip);
}

function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(16);
}

export function isLocalOrDev(ip: string): boolean {
  if (!ip) return true;
  return (
    ip === "127.0.0.1" ||
    ip === "::1" ||
    ip === "::ffff:127.0.0.1" ||
    ip.startsWith("local") ||
    ip === "localhost"
  );
}

/**
 * Check if an IP is currently serving a temporary ban.
 */
export function isIpBanned(ip: string): { banned: boolean; remainingSeconds: number } {
  if (isLocalOrDev(ip)) return { banned: false, remainingSeconds: 0 };
  const now = Date.now();
  const ban = bannedIps.get(ip);
  if (!ban) return { banned: false, remainingSeconds: 0 };

  if (now >= ban.bannedUntil) {
    bannedIps.delete(ip);
    return { banned: false, remainingSeconds: 0 };
  }

  const remainingSeconds = Math.max(1, Math.ceil((ban.bannedUntil - now) / 1000));
  return { banned: true, remainingSeconds };
}

/**
 * Explicitly ban an IP (e.g. on severe abuse or flood detection).
 */
export function banIp(ip: string, durationMs = BASE_BAN_DURATION_MS): number {
  if (isLocalOrDev(ip)) return 0;
  const now = Date.now();
  const existing = bannedIps.get(ip);
  const strikeCount = (existing?.strikeCount || 0) + 1;
  // Exponential backoff for repeated offenders (15m, 30m, 60m...)
  const duration = durationMs * Math.pow(2, Math.min(strikeCount - 1, 3));
  const bannedUntil = now + duration;
  bannedIps.set(ip, { bannedUntil, strikeCount });
  return Math.ceil(duration / 1000);
}

/**
 * Enforce rate limits with sliding-window tracking and automatic flood ban.
 */
export function enforceRateLimit(key: string, limit: number, windowMs = 60_000) {
  const ip = key.includes(":") ? key.split(":")[1] : key;

  // Never block or rate-limit localhost or dev environments
  if (isLocalOrDev(ip)) return;

  // 1. Check if IP is already banned
  const banStatus = isIpBanned(ip);
  if (banStatus.banned) {
    throw new RateLimitError(
      `Your IP is temporarily blocked for ${banStatus.remainingSeconds}s due to high request volume.`,
      "IP_BANNED",
      429
    );
  }

  const now = Date.now();
  const bucket = buckets.get(key);

  // 2. Track flood threshold for the IP globally
  const floodKey = `flood:${ip}`;
  const floodBucket = buckets.get(floodKey);
  if (!floodBucket || floodBucket.resetAt <= now) {
    buckets.set(floodKey, { count: 1, resetAt: now + 60_000 });
  } else {
    floodBucket.count += 1;
    if (floodBucket.count >= FLOOD_THRESHOLD) {
      const banSeconds = banIp(ip);
      throw new RateLimitError(
        `Excessive request flood detected. Your IP is blocked for ${banSeconds}s.`,
        "FLOOD_AUTO_BANNED",
        429
      );
    }
  }

  // 3. Check endpoint-specific rate limit
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }

  bucket.count += 1;
  if (bucket.count > limit) {
    const retryAfter = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
    throw new RateLimitError(
      `Too many requests. Please wait ${retryAfter}s and try again.`,
      "RATE_LIMITED",
      429
    );
  }

  // Routine memory cleanup
  if (buckets.size > 20_000) {
    for (const [id, value] of buckets) {
      if (value.resetAt <= now) buckets.delete(id);
    }
  }
}

export function resetRateLimitsForTesting() {
  buckets.clear();
  bannedIps.clear();
}
