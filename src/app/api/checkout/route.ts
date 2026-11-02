import { z } from "zod";
import {
  ApiError,
  apiError,
  checkOrigin,
  getSession,
  json,
  rateLimit,
  readJson,
} from "@/lib/server/http";
import { ownedJob } from "@/lib/server/generations";
import {
  checkoutConfiguration,
  providerJson,
  safeResultUrl,
} from "@/lib/server/provider";

export const runtime = "nodejs";
const schema = z
  .object({
    pack: z.enum(["single", "trio", "party"]),
    generationId: z.string().uuid(),
  })
  .strict();
const prices = { single: 799, trio: 1990, party: 4990 } as const;

export async function POST(request: Request) {
  try {
    checkOrigin(request);
    const session = await getSession();
    rateLimit(request, session, "checkout-create", 5);
    const input = schema.parse(await readJson(request));
    const job = await ownedJob(input.generationId, session);
    const configuration = checkoutConfiguration();
    if (job.mode !== "live" || job.status !== "succeeded")
      throw new ApiError(
        409,
        "LIVE_RESULT_REQUIRED",
        "Checkout will be available for completed live videos. Sample previews cannot be purchased.",
      );
    const origin = new URL(process.env.APP_ORIGIN || request.url).origin;
    const result = z.object({ url: z.string().max(4000) }).safeParse(
      await providerJson(configuration.url, "sessions", {
        method: "POST",
        key: configuration.key,
        idempotencyKey: `checkout-${job.id}-${input.pack}`,
        body: {
          pack: input.pack,
          mode: "payment",
          currency: "usd",
          amountCents: prices[input.pack],
          generationId: job.id,
          providerGenerationId: job.providerId,
          fulfillment: "watermark-free-hd-download",
          customerReference: session.owner,
          successUrl: `${origin}/?checkout=return`,
          cancelUrl: `${origin}/?checkout=cancelled`,
        },
      }),
    );
    if (!result.success)
      throw new ApiError(
        502,
        "INVALID_PROVIDER_RESPONSE",
        "Checkout did not return a valid payment session.",
      );
    return json({ url: safeResultUrl(result.data.url) });
  } catch (error) {
    return apiError(error);
  }
}
