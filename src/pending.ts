type PendingEntry = {
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
  timeoutId: NodeJS.Timeout;
};

export type PendingStore = {
  create: (requestId: string, timeoutMs: number) => Promise<unknown>;
  resolve: (requestId: string, value: unknown) => boolean;
};

export function createPendingStore(): PendingStore {
  const pending = new Map<string, PendingEntry>();

  return {
    create(requestId: string, timeoutMs: number) {
      return new Promise<unknown>((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          pending.delete(requestId);
          reject(new Error("timeout"));
        }, timeoutMs);

        pending.set(requestId, { resolve, reject, timeoutId });
      });
    },
    resolve(requestId: string, value: unknown) {
      const entry = pending.get(requestId);
      if (!entry) return false;

      clearTimeout(entry.timeoutId);
      pending.delete(requestId);
      entry.resolve(value);
      return true;
    }
  };
}
