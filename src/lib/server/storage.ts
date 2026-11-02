import "server-only";
import { createHash, randomUUID } from "node:crypto";
import {
  mkdir,
  open,
  readFile,
  rename,
  stat,
  unlink,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import { ApiError } from "./http";

// Runtime user data must never be traced into a build/deployment artifact.
export const DATA_ROOT = path.resolve(
  /* turbopackIgnore: true */ process.env.DATA_DIR || `${process.cwd()}/.data`,
);
export const ID_PATTERN = /^[a-zA-Z0-9_-]{16,80}$/;

export function validId(id: string) {
  if (!ID_PATTERN.test(id))
    throw new ApiError(
      404,
      "NOT_FOUND",
      "This item was not found in your session.",
    );
  return id;
}

export async function directory(
  name: "uploads" | "jobs" | "events" | "usage" | "locks",
) {
  const target = path.join(/* turbopackIgnore: true */ DATA_ROOT, name);
  await mkdir(target, { recursive: true, mode: 0o700 });
  return target;
}

export async function readRecord<T>(
  name: "uploads" | "jobs" | "usage",
  id: string,
): Promise<T | undefined> {
  validId(id);
  try {
    return JSON.parse(
      await readFile(path.join(await directory(name), `${id}.json`), "utf8"),
    ) as T;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return undefined;
    throw error;
  }
}

export async function writeRecord(
  name: "uploads" | "jobs" | "usage",
  id: string,
  data: unknown,
) {
  validId(id);
  const folder = await directory(name);
  const file = path.join(folder, `${id}.json`);
  const temporary = path.join(folder, `${id}.${randomUUID()}.tmp`);
  try {
    await writeFile(temporary, JSON.stringify(data), { mode: 0o600 });
    await rename(temporary, file);
  } finally {
    await unlink(temporary).catch(() => undefined);
  }
}

export async function deleteRecord(
  name: "uploads" | "jobs" | "usage",
  id: string,
) {
  await unlink(path.join(await directory(name), `${validId(id)}.json`)).catch(
    (error) => {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    },
  );
}

const locks = new Map<string, Promise<unknown>>();
export async function withLock<T>(
  key: string,
  fn: () => Promise<T>,
): Promise<T> {
  const previous = locks.get(key) || Promise.resolve();
  const work = previous
    .catch(() => undefined)
    .then(async () => {
      // Exclusive files protect reservations across Node processes sharing the
      // same durable volume, not only across requests in this module instance.
      const filename = path.join(
        await directory("locks"),
        `${createHash("sha256").update(key).digest("hex")}.lock`,
      );
      let handle;
      for (let attempt = 0; attempt < 50; attempt++) {
        try {
          handle = await open(filename, "wx", 0o600);
          break;
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
          const current = await stat(filename).catch(() => undefined);
          if (current && Date.now() - current.mtimeMs > 120_000)
            await unlink(filename).catch(() => undefined);
          await new Promise((resolve) => setTimeout(resolve, 20));
        }
      }
      if (!handle)
        throw new ApiError(
          409,
          "REQUEST_IN_PROGRESS",
          "Another request is still being processed. Please try again shortly.",
        );
      try {
        return await fn();
      } finally {
        await handle.close();
        await unlink(filename).catch(() => undefined);
      }
    });
  locks.set(key, work);
  try {
    return await work;
  } finally {
    if (locks.get(key) === work) locks.delete(key);
  }
}
