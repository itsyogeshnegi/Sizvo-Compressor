import { mkdir, readFile, rename, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { JOB_TTL_MS, TEMP_ROOT } from "./config";
import { MAX_FILES } from "./config";
import type { JobFileRecord, JobManifest } from "./types";
import { ValidationError } from "./validation";

const ID_PATTERN = /^[a-f0-9]{48,64}$/;
const locks = new Map<string, Promise<void>>();

function assertId(id: string) {
  if (!ID_PATTERN.test(id)) throw new ValidationError("Job not found.", "JOB_NOT_FOUND", 404);
}

export function getJobDir(jobId: string) {
  assertId(jobId);
  return path.join(TEMP_ROOT, jobId);
}

export async function createJob(): Promise<JobManifest> {
  await mkdir(TEMP_ROOT, { recursive: true });
  const id = randomBytes(24).toString("hex");
  const now = new Date();
  const manifest: JobManifest = {
    id,
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + JOB_TTL_MS).toISOString(),
    files: []
  };
  const dir = getJobDir(id);
  await mkdir(path.join(dir, "files"), { recursive: true });
  await writeFile(path.join(dir, "manifest.json"), JSON.stringify(manifest));
  return manifest;
}

export async function getJob(jobId: string): Promise<JobManifest> {
  const dir = getJobDir(jobId);
  try {
    const manifest = JSON.parse(await readFile(path.join(dir, "manifest.json"), "utf8")) as JobManifest;
    if (Date.parse(manifest.expiresAt) <= Date.now()) {
      await rm(dir, { recursive: true, force: true });
      throw new ValidationError("This compression job has expired.", "JOB_EXPIRED", 410);
    }
    return manifest;
  } catch (error) {
    if (error instanceof ValidationError) throw error;
    throw new ValidationError("Job not found.", "JOB_NOT_FOUND", 404);
  }
}

export async function addJobFile(jobId: string, record: JobFileRecord) {
  const previous = locks.get(jobId) ?? Promise.resolve();
  let release!: () => void;
  const current = new Promise<void>((resolve) => { release = resolve; });
  const queued = previous.then(() => current);
  locks.set(jobId, queued);
  await previous;
  try {
    const manifest = await getJob(jobId);
    if (manifest.files.length >= MAX_FILES) {
      throw new ValidationError(`A job can contain up to ${MAX_FILES} images.`, "FILE_LIMIT", 413);
    }
    manifest.files.push(record);
    const manifestPath = path.join(getJobDir(jobId), "manifest.json");
    const temporaryPath = `${manifestPath}.${randomBytes(4).toString("hex")}.tmp`;
    await writeFile(temporaryPath, JSON.stringify(manifest));
    await rename(temporaryPath, manifestPath);
  } finally {
    release();
    if (locks.get(jobId) === queued) locks.delete(jobId);
  }
}

export async function deleteJob(jobId: string) {
  const dir = getJobDir(jobId);
  await rm(dir, { recursive: true, force: true });
}

export async function cleanupExpiredJobs() {
  await mkdir(TEMP_ROOT, { recursive: true });
  const { readdir } = await import("node:fs/promises");
  const entries = await readdir(TEMP_ROOT, { withFileTypes: true });
  await Promise.all(entries.filter((entry) => entry.isDirectory()).map(async (entry) => {
    if (!ID_PATTERN.test(entry.name)) return;
    const manifestPath = path.join(TEMP_ROOT, entry.name, "manifest.json");
    try {
      const manifest = JSON.parse(await readFile(manifestPath, "utf8")) as JobManifest;
      if (Date.parse(manifest.expiresAt) <= Date.now()) await rm(path.dirname(manifestPath), { recursive: true, force: true });
    } catch {
      const info = await stat(path.join(TEMP_ROOT, entry.name));
      if (info.mtimeMs + JOB_TTL_MS <= Date.now()) await rm(path.join(TEMP_ROOT, entry.name), { recursive: true, force: true });
    }
  }));
}

export function outputPath(jobId: string, fileId: string) {
  assertId(fileId);
  return path.join(getJobDir(jobId), "files", fileId);
}
