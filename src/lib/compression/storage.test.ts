import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { cleanupExpiredJobs, createJob, deleteJob, getJob, getJobDir } from "./storage";
import type { JobManifest } from "./types";

const createdJobs: string[] = [];

afterEach(async () => {
  await Promise.all(createdJobs.splice(0).map((id) => deleteJob(id)));
});

describe("temporary job storage", () => {
  it("creates an isolated job with an unguessable id", async () => {
    const job = await createJob();
    createdJobs.push(job.id);
    expect(job.id).toMatch(/^[a-f0-9]{48}$/);
    expect(job.files).toEqual([]);
    expect(Date.parse(job.expiresAt)).toBeGreaterThan(Date.now());
  });

  it("removes expired jobs during cleanup", async () => {
    const job = await createJob();
    createdJobs.push(job.id);
    const manifestPath = path.join(getJobDir(job.id), "manifest.json");
    const manifest = JSON.parse(await readFile(manifestPath, "utf8")) as JobManifest;
    manifest.expiresAt = new Date(Date.now() - 1000).toISOString();
    await writeFile(manifestPath, JSON.stringify(manifest));
    await cleanupExpiredJobs();
    await expect(getJob(job.id)).rejects.toMatchObject({ code: "JOB_NOT_FOUND", status: 404 });
  });
});
