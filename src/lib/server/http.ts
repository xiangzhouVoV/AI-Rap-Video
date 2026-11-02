import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ZodError } from "zod";

const SESSION_COOKIE = "arv_session";
const SESSION_PATTERN = /^[a-f0-9]{64}$/;
const buckets = new Map<string, { count: number; until: number }>();

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

export type Session = { owner: string };

export async function getSession(create = false): Promise<Session> {
  const jar = await cookies();
  let token = jar.get(SESSION_COOKIE)?.value;
  if (!token || !SESSION_PATTERN.test(token)) {
    if (!create)
      throw new ApiError(
        404,
        "NOT_FOUND",
        "This item was not found in your session.",
      );
    token = randomBytes(32).toString("hex");
    jar.set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    });
  }
  return { owner: createHash("sha256").update(token).digest("hex") };
}

export function checkOrigin(request: Request): void {
  const requestUrl = new URL(request.url);
  const configuredOrigin = process.env.APP_ORIGIN;
  // Next's development server can reconstruct request.url as localhost while
  // the browser connected to 127.0.0.1. HTTP Host is the actual receiving
  // authority; never substitute an untrusted forwarded host header here.
  const host = request.headers.get("host");
  let expectedOrigin = requestUrl.origin;
  if (configuredOrigin) {
    try {
      const configured = new URL(configuredOrigin);
      if (!["http:", "https:"].includes(configured.protocol) || configured.username || configured.password) {
        throw new Error("Invalid origin");
      }
      expectedOrigin = configured.origin;
    } catch {
      throw new ApiError(
        503,
        "INVALID_CONFIGURATION",
        "The site origin is not configured correctly.",
      );
    }
  } else if (host) {
    if (!/^[a-zA-Z0-9.:[\]-]+$/.test(host))
      throw new ApiError(
        403,
        "INVALID_ORIGIN",
        "The receiving website host is invalid.",
      );
    try {
      expectedOrigin = new URL(`${requestUrl.protocol}//${host}`).origin;
    } catch {
      throw new ApiError(
        403,
        "INVALID_ORIGIN",
        "The receiving website host is invalid.",
      );
    }
  }
  const origin = request.headers.get("origin");
  if (
    !origin ||
    origin !== expectedOrigin ||
    request.headers.get("sec-fetch-site") === "cross-site"
  ) {
    throw new ApiError(
      403,
      "INVALID_ORIGIN",
      "Please submit this request from this website.",
    );
  }
}

export function rateLimit(
  request: Request,
  session: Session,
  action: string,
  limit: number,
  windowMs = 60_000,
): void {
  // Do not trust public X-Forwarded-For headers as client identity. The session
  // limiter is supplemented by a conservative process-wide limit below.
  void request;
  const now = Date.now();
  if (buckets.size > 5000) {
    for (const [key, bucket] of buckets)
      if (bucket.until <= now) buckets.delete(key);
  }
  for (const [key, maximum] of [
    [`${action}:${session.owner}`, limit],
    [`global:${action}`, Math.max(100, limit * 40)],
  ] as const) {
    let bucket = buckets.get(key);
    if (!bucket || bucket.until <= now) {
      bucket = { count: 0, until: now + windowMs };
      buckets.set(key, bucket);
    }
    if (bucket.count >= maximum)
      throw new ApiError(
        429,
        "RATE_LIMITED",
        "Too many requests. Please try again in a minute.",
      );
    bucket.count += 1;
  }
}

export async function readBody(
  request: Request,
  maxBytes: number,
): Promise<Buffer> {
  const declaredSize = Number(request.headers.get("content-length") || 0);
  if (declaredSize > maxBytes)
    throw new ApiError(413, "FILE_TOO_LARGE", "This request is too large.");
  if (!request.body)
    throw new ApiError(400, "EMPTY_BODY", "A request body is required.");
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      total += chunk.value.byteLength;
      if (total > maxBytes) {
        await reader.cancel();
        throw new ApiError(413, "FILE_TOO_LARGE", "This request is too large.");
      }
      chunks.push(chunk.value);
    }
  } finally {
    reader.releaseLock();
  }
  return Buffer.concat(chunks);
}

export async function readJson(
  request: Request,
  maxBytes = 16_384,
): Promise<unknown> {
  if (request.headers.get("content-type")?.toLowerCase().split(";")[0].trim() !== "application/json") {
    throw new ApiError(
      415,
      "UNSUPPORTED_CONTENT_TYPE",
      "Send an application/json request.",
    );
  }
  try {
    return JSON.parse((await readBody(request, maxBytes)).toString("utf8"));
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      400,
      "INVALID_JSON",
      "The request contains invalid JSON.",
    );
  }
}

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export function apiError(error: unknown) {
  if (error instanceof ApiError)
    return json(
      { error: { code: error.code, message: error.message } },
      error.status,
    );
  if (error instanceof ZodError)
    return json(
      {
        error: {
          code: "INVALID_INPUT",
          message:
            error.issues[0]?.message || "Please check the request fields.",
        },
      },
      400,
    );
  // Never include provider responses, file paths, stack traces, or credentials.
  console.error(
    "API request failed",
    error instanceof Error ? error.name : "UnknownError",
  );
  return json(
    {
      error: {
        code: "INTERNAL_ERROR",
        message: "Something went wrong. Please try again.",
      },
    },
    500,
  );
}
