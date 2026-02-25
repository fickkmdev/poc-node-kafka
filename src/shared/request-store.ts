import { RequestTimeoutError } from "./errors";

type PendingEntry<T> = {
  resolve: (value: T) => void;
  reject: (reason?: unknown) => void;
  timeoutId: NodeJS.Timeout;
};

export class RequestStore<T> {
  private readonly pending = new Map<string, PendingEntry<T>>();

  waitFor(requestId: string, timeoutMs: number): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.pending.delete(requestId);
        reject(new RequestTimeoutError());
      }, timeoutMs);

      this.pending.set(requestId, { resolve, reject, timeoutId });
    });
  }

  resolve(requestId: string, value: T): boolean {
    const entry = this.pending.get(requestId);
    if (!entry) return false;

    clearTimeout(entry.timeoutId);
    this.pending.delete(requestId);
    entry.resolve(value);
    return true;
  }

  rejectAll(reason: Error): void {
    for (const [requestId, entry] of this.pending.entries()) {
      clearTimeout(entry.timeoutId);
      this.pending.delete(requestId);
      entry.reject(reason);
    }
  }
}
