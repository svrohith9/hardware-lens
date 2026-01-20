import { kv as vercelKv } from "@vercel/kv";

const memory = new Map<string, { value: unknown; exp?: number }>();

function now() {
  return Math.floor(Date.now() / 1000);
}

function shouldUseMemory() {
  return !process.env.KV_REST_API_URL;
}

export const kv = {
  async get<T>(key: string): Promise<T | null> {
    if (!shouldUseMemory()) {
      return (await vercelKv.get<T>(key)) ?? null;
    }
    const entry = memory.get(key);
    if (!entry) return null;
    if (entry.exp && entry.exp < now()) {
      memory.delete(key);
      return null;
    }
    return entry.value as T;
  },
  async set(key: string, value: unknown, opts?: { ex?: number }) {
    if (!shouldUseMemory()) {
      if (opts?.ex) {
        await vercelKv.set(key, value, { ex: opts.ex });
      } else {
        await vercelKv.set(key, value);
      }
      return;
    }
    const exp = opts?.ex ? now() + opts.ex : undefined;
    memory.set(key, { value, exp });
  },
  async del(key: string) {
    if (!shouldUseMemory()) {
      await vercelKv.del(key);
      return;
    }
    memory.delete(key);
  },
  async incr(key: string) {
    if (!shouldUseMemory()) {
      return await vercelKv.incr(key);
    }
    const entry = await this.get<number>(key);
    const next = (entry ?? 0) + 1;
    memory.set(key, { value: next });
    return next;
  },
  async expire(key: string, seconds: number) {
    if (!shouldUseMemory()) {
      await vercelKv.expire(key, seconds);
      return;
    }
    const entry = memory.get(key);
    if (!entry) return;
    entry.exp = now() + seconds;
    memory.set(key, entry);
  }
};
