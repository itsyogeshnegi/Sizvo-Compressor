import { ValidationError } from "./validation";

interface ActiveTask {
  ip: string;
  startedAt: number;
}

const MAX_PER_IP = 2;
const MAX_GLOBAL = 4;
const QUEUE_TIMEOUT_MS = 15_000;
const MAX_QUEUE_LENGTH = 10;

class ConcurrencyLimiter {
  private activeJobs: Set<ActiveTask> = new Set();
  private ipJobCount: Map<string, number> = new Map();
  private queue: Array<{
    ip: string;
    resolve: () => void;
    reject: (err: Error) => void;
    timer: NodeJS.Timeout;
  }> = [];

  public getStats() {
    return {
      activeGlobal: this.activeJobs.size,
      queued: this.queue.length,
      maxGlobal: MAX_GLOBAL,
      maxPerIp: MAX_PER_IP
    };
  }

  private canRun(ip: string): boolean {
    const currentIpActive = this.ipJobCount.get(ip) || 0;
    return this.activeJobs.size < MAX_GLOBAL && currentIpActive < MAX_PER_IP;
  }

  public async acquire(ip: string): Promise<() => void> {
    if (this.canRun(ip)) {
      return this.startJob(ip);
    }

    if (this.queue.length >= MAX_QUEUE_LENGTH) {
      throw new ValidationError(
        "Server is experiencing high compression traffic. Please wait a moment and try again.",
        "SERVER_BUSY",
        429
      );
    }

    return new Promise<() => void>((resolve, reject) => {
      const timer = setTimeout(() => {
        const index = this.queue.findIndex((entry) => entry.timer === timer);
        if (index !== -1) {
          this.queue.splice(index, 1);
          reject(
            new ValidationError(
              "Server took too long to assign compression capacity. Please retry.",
              "QUEUE_TIMEOUT",
              429
            )
          );
        }
      }, QUEUE_TIMEOUT_MS);

      this.queue.push({
        ip,
        resolve: () => {
          clearTimeout(timer);
          resolve(this.startJob(ip));
        },
        reject,
        timer
      });
    });
  }

  private startJob(ip: string): () => void {
    const task: ActiveTask = { ip, startedAt: Date.now() };
    this.activeJobs.add(task);
    this.ipJobCount.set(ip, (this.ipJobCount.get(ip) || 0) + 1);

    let released = false;
    return () => {
      if (released) return;
      released = true;
      this.activeJobs.delete(task);
      const count = (this.ipJobCount.get(ip) || 1) - 1;
      if (count <= 0) {
        this.ipJobCount.delete(ip);
      } else {
        this.ipJobCount.set(ip, count);
      }
      this.processQueue();
    };
  }

  private processQueue() {
    if (this.queue.length === 0) return;

    for (let i = 0; i < this.queue.length; i++) {
      const candidate = this.queue[i];
      if (this.canRun(candidate.ip)) {
        this.queue.splice(i, 1);
        candidate.resolve();
        break;
      }
    }
  }

  public resetForTesting() {
    this.activeJobs.clear();
    this.ipJobCount.clear();
    for (const item of this.queue) {
      clearTimeout(item.timer);
    }
    this.queue = [];
  }
}

export const heavyJobLimiter = new ConcurrencyLimiter();
