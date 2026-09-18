import { beforeEach, describe, expect, it } from "vitest";
import { heavyJobLimiter } from "./concurrency";
import {
  banIp,
  clientKey,
  enforceRateLimit,
  extractClientIp,
  isIpBanned,
  RateLimitError,
  resetRateLimitsForTesting
} from "./rate-limit";

describe("Security & Anti-DDoS Protections", () => {
  beforeEach(() => {
    resetRateLimitsForTesting();
    heavyJobLimiter.resetForTesting();
  });

  describe("IP Extraction & Anti-Spoofing", () => {
    it("prioritizes Cloudflare CF-Connecting-IP header", () => {
      const request = new Request("http://localhost:3000/api/test", {
        headers: {
          "cf-connecting-ip": "203.0.113.195",
          "x-real-ip": "198.51.100.1",
          "x-forwarded-for": "192.0.2.1"
        }
      });
      expect(extractClientIp(request)).toBe("203.0.113.195");
    });

    it("uses X-Real-IP when Cloudflare is not present", () => {
      const request = new Request("http://localhost:3000/api/test", {
        headers: {
          "x-real-ip": "198.51.100.42",
          "x-forwarded-for": "10.0.0.1"
        }
      });
      expect(extractClientIp(request)).toBe("198.51.100.42");
    });

    it("extracts first valid IP from X-Forwarded-For chain", () => {
      const request = new Request("http://localhost:3000/api/test", {
        headers: {
          "x-forwarded-for": "198.51.100.99, 10.0.0.2, 172.16.0.1"
        }
      });
      expect(extractClientIp(request)).toBe("198.51.100.99");
    });

    it("falls back to local user-agent hash when headers are absent", () => {
      const request = new Request("http://localhost:3000/api/test", {
        headers: {
          "user-agent": "Mozilla/5.0 TestBrowser"
        }
      });
      const ip = clientKey(request);
      expect(ip).toMatch(/^local:[0-9a-f]+$/);
    });
  });

  describe("Rate Limiting & Auto-Ban", () => {
    it("allows requests under the rate limit", () => {
      expect(() => {
        enforceRateLimit("test:192.0.2.10", 5, 60_000);
        enforceRateLimit("test:192.0.2.10", 5, 60_000);
      }).not.toThrow();
    });

    it("rejects with 429 when rate limit is exceeded", () => {
      for (let i = 0; i < 3; i++) {
        enforceRateLimit("limit:192.0.2.20", 3, 60_000);
      }
      expect(() => {
        enforceRateLimit("limit:192.0.2.20", 3, 60_000);
      }).toThrowError(RateLimitError);

      try {
        enforceRateLimit("limit:192.0.2.20", 3, 60_000);
      } catch (err) {
        expect(err).toBeInstanceOf(RateLimitError);
        expect((err as RateLimitError).code).toBe("RATE_LIMITED");
        expect((err as RateLimitError).status).toBe(429);
      }
    });

    it("auto-bans flooding IPs and returns remainingSeconds", () => {
      const attackerIp = "198.51.100.88";

      // Simulate flooding up to 120 hits
      let floodCaught = false;
      try {
        for (let i = 0; i < 125; i++) {
          enforceRateLimit(`endpoint:${attackerIp}`, 200, 60_000);
        }
      } catch (err) {
        floodCaught = true;
        expect((err as RateLimitError).code).toBe("FLOOD_AUTO_BANNED");
        expect((err as RateLimitError).status).toBe(429);
      }
      expect(floodCaught).toBe(true);

      // Verify IP is marked as banned
      const banInfo = isIpBanned(attackerIp);
      expect(banInfo.banned).toBe(true);
      expect(banInfo.remainingSeconds).toBeGreaterThan(0);

      // Any subsequent request throws IP_BANNED
      expect(() => {
        enforceRateLimit(`any_route:${attackerIp}`, 100, 60_000);
      }).toThrowError(/temporarily blocked/);
    });

    it("escalates ban duration for repeat strikes", () => {
      const ip = "192.0.2.99";
      const ban1 = banIp(ip, 60_000);
      expect(ban1).toBe(60);

      const ban2 = banIp(ip, 60_000);
      expect(ban2).toBe(120); // Doubled backoff
    });
  });

  describe("Heavy Job Concurrency Limiter (Sharp & FFmpeg)", () => {
    it("permits up to 2 concurrent jobs per IP", async () => {
      const ip = "192.0.2.50";
      const release1 = await heavyJobLimiter.acquire(ip);
      const release2 = await heavyJobLimiter.acquire(ip);

      const stats = heavyJobLimiter.getStats();
      expect(stats.activeGlobal).toBe(2);

      release1();
      release2();
      expect(heavyJobLimiter.getStats().activeGlobal).toBe(0);
    });

    it("queues and unblocks a 3rd job from the same IP when a slot opens", async () => {
      const ip = "192.0.2.60";
      const release1 = await heavyJobLimiter.acquire(ip);
      const release2 = await heavyJobLimiter.acquire(ip);

      let thirdResolved = false;
      const job3Promise = heavyJobLimiter.acquire(ip).then((release3) => {
        thirdResolved = true;
        return release3;
      });

      // Initially queued
      expect(thirdResolved).toBe(false);
      expect(heavyJobLimiter.getStats().queued).toBe(1);

      // Release one slot
      release1();

      // Wait a tick for queue processing
      const release3 = await job3Promise;
      expect(thirdResolved).toBe(true);

      release2();
      release3();
    });

    it("enforces max 4 global concurrent jobs across multiple IPs", async () => {
      const r1 = await heavyJobLimiter.acquire("192.0.2.1");
      const r2 = await heavyJobLimiter.acquire("192.0.2.2");
      const r3 = await heavyJobLimiter.acquire("192.0.2.3");
      const r4 = await heavyJobLimiter.acquire("192.0.2.4");

      expect(heavyJobLimiter.getStats().activeGlobal).toBe(4);

      let fifthJobFinished = false;
      const job5 = heavyJobLimiter.acquire("192.0.2.5").then((r5) => {
        fifthJobFinished = true;
        return r5;
      });

      expect(fifthJobFinished).toBe(false);

      r1();
      const r5 = await job5;
      expect(fifthJobFinished).toBe(true);

      r2();
      r3();
      r4();
      r5();
    });
  });
});
