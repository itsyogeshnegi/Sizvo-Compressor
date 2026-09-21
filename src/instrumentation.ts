export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  // Vercel functions do not share their ephemeral filesystems, and timers do
  // not survive an invocation. The active Vercel image flow is stateless.
  if (process.env.VERCEL) return;
  const { cleanupExpiredJobs } = await import("@/lib/compression/storage");
  const globalState = globalThis as typeof globalThis & { sizvoCleanupTimer?: NodeJS.Timeout };
  if (globalState.sizvoCleanupTimer) return;
  await cleanupExpiredJobs().catch(console.error);
  globalState.sizvoCleanupTimer = setInterval(() => {
    void cleanupExpiredJobs().catch(console.error);
  }, 5 * 60 * 1000);
  globalState.sizvoCleanupTimer.unref();
}
