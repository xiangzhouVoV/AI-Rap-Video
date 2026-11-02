import "server-only";
import { z } from "zod";
import { ApiError } from "./http";

function configuredUrl(value: string | undefined, label: string): URL {
  if (!value)
    throw new ApiError(
      503,
      "PROVIDER_NOT_CONFIGURED",
      `${label} is not connected yet.`,
    );
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new ApiError(
      503,
      "INVALID_CONFIGURATION",
      `${label} configuration is invalid.`,
    );
  }
  const local =
    process.env.NODE_ENV !== "production" &&
    ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  if (
    (url.protocol !== "https:" && !(local && url.protocol === "http:")) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  ) {
    throw new ApiError(
      503,
      "INVALID_CONFIGURATION",
      `${label} requires a secure endpoint without URL credentials or query parameters.`,
    );
  }
  return url;
}

export function safeResultUrl(value: string): string {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new ApiError(
      502,
      "INVALID_PROVIDER_RESPONSE",
      "The provider returned an invalid result URL.",
    );
  }
  const local =
    process.env.NODE_ENV !== "production" &&
    ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  if (
    (url.protocol !== "https:" && !(local && url.protocol === "http:")) ||
    url.username ||
    url.password
  ) {
    throw new ApiError(
      502,
      "INVALID_PROVIDER_RESPONSE",
      "The provider returned an unsafe result URL.",
    );
  }
  return url.href;
}

export function videoConfiguration() {
  if (!process.env.VIDEO_PROVIDER_URL) return undefined;
  if (process.env.LIVE_GENERATION_ENABLED !== "true") {
    throw new ApiError(
      503,
      "LIVE_GENERATION_DISABLED",
      "Live video generation is waiting for provider and cost checks. Please try again later.",
    );
  }
  const freeCap = Number(process.env.FREE_VIDEO_MAX_COST_USD || "0.50");
  const paidCap = Number(process.env.PAID_VIDEO_MAX_COST_USD || "1.50");
  if (
    !Number.isFinite(freeCap) ||
    freeCap <= 0 ||
    freeCap > 0.5 ||
    !Number.isFinite(paidCap) ||
    paidCap <= 0 ||
    paidCap > 1.5
  ) {
    throw new ApiError(
      503,
      "INVALID_COST_CAP",
      "Video cost caps must be configured before live generation can start.",
    );
  }
  return {
    url: configuredUrl(process.env.VIDEO_PROVIDER_URL, "The video provider"),
    key: process.env.VIDEO_PROVIDER_KEY,
    freeCap,
    paidCap,
  };
}

export async function providerJson(
  base: URL,
  suffix: string,
  options: {
    method?: "POST" | "GET";
    body?: unknown;
    key?: string;
    idempotencyKey?: string;
    timeoutMs?: number;
  },
) {
  const endpoint = new URL(
    `${base.pathname.replace(/\/$/, "")}/${suffix.replace(/^\//, "")}`,
    base.origin,
  );
  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: options.method || "GET",
      headers: {
        Accept: "application/json",
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...(options.key ? { Authorization: `Bearer ${options.key}` } : {}),
        ...(options.idempotencyKey
          ? { "Idempotency-Key": options.idempotencyKey }
          : {}),
      },
      ...(options.body ? { body: JSON.stringify(options.body) } : {}),
      signal: AbortSignal.timeout(options.timeoutMs || 15_000),
      redirect: "error",
      cache: "no-store",
    });
  } catch {
    throw new ApiError(
      502,
      "PROVIDER_UNAVAILABLE",
      "The provider could not be reached. Please try again later.",
    );
  }
  if (!response.ok)
    throw new ApiError(
      502,
      "PROVIDER_REJECTED",
      "The provider could not complete this request. Please try again later.",
    );
  const reader = response.body?.getReader();
  if (!reader)
    throw new ApiError(
      502,
      "INVALID_PROVIDER_RESPONSE",
      "The provider returned an empty response.",
    );
  let length = 0;
  const chunks: Uint8Array[] = [];
  try {
    while (true) {
      const result = await reader.read();
      if (result.done) break;
      length += result.value.byteLength;
      if (length > 65_536) {
        await reader.cancel();
        throw new ApiError(
          502,
          "INVALID_PROVIDER_RESPONSE",
          "The provider response was too large.",
        );
      }
      chunks.push(result.value);
    }
    return JSON.parse(Buffer.concat(chunks).toString("utf8")) as unknown;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      502,
      "INVALID_PROVIDER_RESPONSE",
      "The provider returned an unreadable response.",
    );
  } finally {
    reader.releaseLock();
  }
}

export const quoteSchema = z.object({
  quoteId: z.string().min(1).max(200),
  estimatedCostUsd: z.number().finite().nonnegative(),
  currency: z.literal("USD"),
  expiresAt: z.iso.datetime(),
});

export const providerCreatedSchema = z.object({
  id: z.string().min(1).max(200),
});
export const providerJobSchema = z.object({
  status: z.enum(["queued", "processing", "succeeded", "failed"]),
  progress: z.number().min(0).max(100).optional(),
  videoUrl: z.string().max(4000).optional(),
  posterUrl: z.string().max(4000).optional(),
});

export function checkoutConfiguration() {
  if (!process.env.CHECKOUT_PROVIDER_URL)
    throw new ApiError(
      503,
      "PAYMENTS_UNAVAILABLE",
      "Payments are not connected yet. No payment was taken. Please try again when checkout is available.",
    );
  // Enabling payments also requires an operator to complete fulfillment and
  // webhook integration. Merely pasting a URL must never collect real money.
  if (process.env.CHECKOUT_ENABLED !== "true")
    throw new ApiError(
      503,
      "PAYMENTS_DISABLED",
      "Checkout is not open yet. No payment was taken.",
    );
  return {
    url: configuredUrl(
      process.env.CHECKOUT_PROVIDER_URL,
      "The checkout provider",
    ),
    key: process.env.CHECKOUT_PROVIDER_KEY,
  };
}
