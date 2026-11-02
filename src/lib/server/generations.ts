import "server-only";
import { randomUUID } from "node:crypto";
import { open, stat } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { ApiError, type Session } from "./http";
import { recordEvent } from "./events";
import {
  providerCreatedSchema,
  providerJobSchema,
  providerJson,
  quoteSchema,
  safeResultUrl,
  videoConfiguration,
} from "./provider";
import {
  deleteRecord,
  readRecord,
  validId,
  withLock,
  writeRecord,
} from "./storage";
import { getUpload, uploadBytes } from "./uploads";

export const generationSchema = z
  .object({
    uploadIds: z.array(z.string().uuid()).min(1).max(2),
    style: z.enum(["rap", "dance", "cinematic", "crowd"]),
    variant: z.enum(["couple", "friends", "pets", "solo"]),
    aspectRatio: z.enum(["9:16", "16:9", "1:1"]),
    duration: z.union([z.literal(5), z.literal(10)]),
    model: z.enum(["standard", "plus"]),
    consent: z.literal(true, {
      error: "Please confirm you have permission to use these photos.",
    }),
  })
  .strict()
  .superRefine((input, context) => {
    if (input.uploadIds.length !== (input.style === "crowd" ? 2 : 1)) {
      context.addIssue({
        code: "custom",
        message:
          input.style === "crowd"
            ? "Add both photos for the crowd effect."
            : "Add one photo for this style.",
        path: ["uploadIds"],
      });
    }
  });

export type GenerationInput = z.infer<typeof generationSchema>;
export type PublicJob = {
  id: string;
  status: "queued" | "processing" | "succeeded" | "failed";
  progress: number;
  mode: "demo" | "live";
  style: GenerationInput["style"];
  variant: GenerationInput["variant"];
  aspectRatio: GenerationInput["aspectRatio"];
  duration: GenerationInput["duration"];
  model: GenerationInput["model"];
  createdAt: string;
  videoUrl?: string;
  posterUrl?: string;
  error?: string;
  creditsRefunded?: boolean;
};
export type JobRecord = PublicJob & {
  owner: string;
  uploadIds: string[];
  providerId?: string;
  lastCheckedAt?: string;
  completedAt?: string;
  email?: string;
  emailSavedAt?: string;
  failureConfirmed?: boolean;
};

export function publicJob(job: JobRecord): PublicJob {
  const {
    id,
    status,
    progress,
    mode,
    style,
    variant,
    aspectRatio,
    duration,
    model,
    createdAt,
    videoUrl,
    posterUrl,
    error,
    creditsRefunded,
  } = job;
  return {
    id,
    status,
    progress,
    mode,
    style,
    variant,
    aspectRatio,
    duration,
    model,
    createdAt,
    videoUrl,
    posterUrl,
    error,
    creditsRefunded,
  };
}

export async function ownedJob(id: string, session: Session) {
  const job = await readRecord<JobRecord>("jobs", validId(id));
  if (!job || job.owner !== session.owner)
    throw new ApiError(
      404,
      "NOT_FOUND",
      "This render was not found in your session.",
    );
  return job;
}

const prompts = {
  rap: "A cinematic rap performance. Keep the reference person's face recognizable. Confident stage presence, natural small movements, dramatic concert lighting, no text, no sound.",
  dance:
    "A lively dance rap scene with the reference person. Keep their face recognizable. Natural movement, dynamic stage lighting, full-body framing where possible, no text, no sound.",
  cinematic:
    "A cinematic portrait of the reference person, preserving facial identity. Moody soft lighting, subtle camera push-in, natural expression and movement, film texture, no text, no sound.",
  crowd:
    "Two reference subjects find each other in a nighttime crowd: the first stands on a balcony, the second is revealed by a warm spotlight below. Preserve their appearance. A slow camera move and a shared look, cinematic lighting, no text, no sound.",
};

function providerInput(input: GenerationInput) {
  const mood = {
    couple: "Romantic connection.",
    friends: "A joyful friendship reunion.",
    pets: "A warm connection between a person and their pet; preserve the pet's appearance.",
    solo: "A reflective moment between two versions of the same person.",
  }[input.variant];
  return {
    style: input.style,
    variant: input.variant,
    aspectRatio: input.aspectRatio,
    duration: input.duration,
    model: input.model,
    resolution: "480p",
    watermark: true,
    audio: false,
    prompt: `${prompts[input.style]} ${input.style === "crowd" ? mood : ""}`,
  };
}

export async function createGeneration(
  input: GenerationInput,
  session: Session,
) {
  for (const id of input.uploadIds) await getUpload(id, session);
  const configuration = videoConfiguration();
  const job: JobRecord = {
    id: randomUUID(),
    owner: session.owner,
    uploadIds: input.uploadIds,
    status: "queued",
    progress: 0,
    mode: configuration ? "live" : "demo",
    style: input.style,
    variant: input.variant,
    aspectRatio: input.aspectRatio,
    duration: input.duration,
    model: input.model,
    createdAt: new Date().toISOString(),
    posterUrl: "/images/crowd-scene.jpg",
  };
  if (!configuration) {
    await writeRecord("jobs", job.id, job);
    return publicJob(job);
  }
  if (input.model !== "standard" || input.duration !== 5)
    throw new ApiError(
      422,
      "FREE_TIER_LIMIT",
      "Your first free video uses Standard, 5 seconds, 480p with a watermark. Choose those settings to continue.",
    );
  return withLock(`allowance:${session.owner}`, async () => {
    const allowance = await readRecord<{ jobId: string }>(
      "usage",
      session.owner,
    );
    if (allowance)
      throw new ApiError(
        402,
        "FREE_VIDEO_USED",
        "Your first free render has already been requested. Paid generation will be available after checkout is connected.",
      );
    const fields = providerInput(input);
    const rawQuote = await providerJson(configuration.url, "quotes", {
      method: "POST",
      key: configuration.key,
      body: {
        ...fields,
        inputCount: input.uploadIds.length,
        pricingTier: "free",
        maxCostUsd: configuration.freeCap,
      },
    });
    const parsedQuote = quoteSchema.safeParse(rawQuote);
    if (!parsedQuote.success)
      throw new ApiError(
        502,
        "INVALID_PROVIDER_QUOTE",
        "The provider did not return a valid cost quote. No render was requested.",
      );
    const quote = parsedQuote.data;
    if (
      quote.estimatedCostUsd > configuration.freeCap ||
      new Date(quote.expiresAt).getTime() <= Date.now() + 5000
    ) {
      throw new ApiError(
        422,
        "COST_CAP_EXCEEDED",
        "This render cannot be started within the free video cost limit. No render was requested.",
      );
    }
    const images = await Promise.all(
      input.uploadIds.map(async (id) => ({
        id,
        mimeType: "image/jpeg",
        data: (await uploadBytes(id, session)).toString("base64"),
      })),
    );
    // Persist the reservation before an operation that may incur a charge.
    // An ambiguous create timeout keeps this reservation to prevent rebilling.
    await writeRecord("jobs", job.id, job);
    await writeRecord("usage", session.owner, {
      jobId: job.id,
      reservedAt: new Date().toISOString(),
      quoteId: quote.quoteId,
      maxCostUsd: configuration.freeCap,
    });
    try {
      const created = providerCreatedSchema.safeParse(
        await providerJson(configuration.url, "jobs", {
          method: "POST",
          key: configuration.key,
          idempotencyKey: job.id,
          timeoutMs: 30_000,
          body: {
            ...fields,
            inputs: images,
            quoteId: quote.quoteId,
            maxCostUsd: configuration.freeCap,
            pricingTier: "free",
            idempotencyKey: job.id,
          },
        }),
      );
      if (!created.success)
        throw new ApiError(
          502,
          "INVALID_PROVIDER_RESPONSE",
          "The provider did not return a render ID.",
        );
      job.providerId = created.data.id;
    } catch {
      job.status = "failed";
      job.progress = 100;
      job.completedAt = new Date().toISOString();
      job.error =
        "The provider did not confirm this render. No credits were charged by this website. Please contact support before trying another paid render.";
      job.creditsRefunded = false;
    }
    await writeRecord("jobs", job.id, job);
    if (job.status === "failed") await completionEvent(job);
    return publicJob(job);
  });
}

async function completionEvent(job: JobRecord) {
  await recordEvent(
    job.owner,
    "generation_completed",
    job.style === "crowd" ? "/i-found-you-in-the-crowd" : "/",
    job.id,
    `${job.mode}:${job.status}`,
  );
}

async function releaseFailedAllowance(job: JobRecord) {
  if (job.mode !== "live" || job.status !== "failed" || !job.failureConfirmed)
    return;
  await withLock(`allowance:${job.owner}`, async () => {
    const allowance = await readRecord<{ jobId: string }>("usage", job.owner);
    if (allowance?.jobId === job.id) await deleteRecord("usage", job.owner);
  });
}

export async function refreshGeneration(id: string, session: Session) {
  return withLock(`job:${id}`, async () => {
    const job = await ownedJob(id, session);
    if (job.status === "succeeded" || job.status === "failed") {
      await releaseFailedAllowance(job);
      await completionEvent(job);
      return publicJob(job);
    }
    const age = Date.now() - new Date(job.createdAt).getTime();
    if (job.mode === "demo") {
      job.status = age < 1000 ? "queued" : "processing";
      job.progress = Math.min(94, Math.floor(age / 60));
      if (age >= 6000) {
        try {
          const samplePath = path.join(
            process.cwd(),
            "public",
            "samples",
            "crowd-preview.mp4",
          );
          const sample = await stat(samplePath);
          if (!sample.isFile() || sample.size < 512)
            throw new Error("Sample video is empty");
          const file = await open(samplePath, "r");
          try {
            const header = Buffer.alloc(32);
            const { bytesRead } = await file.read(header, 0, header.length, 0);
            if (bytesRead < 16 || header.toString("ascii", 4, 8) !== "ftyp")
              throw new Error("Sample video is not an MP4");
          } finally {
            await file.close();
          }
          job.status = "succeeded";
          job.videoUrl = "/samples/crowd-preview.mp4";
        } catch {
          job.status = "failed";
          job.error =
            "The sample preview is temporarily unavailable. Your photos were not sent to an AI provider and no credits were used. Please try again later.";
          job.creditsRefunded = false;
        }
      }
    } else if (age >= 20 * 60_000) {
      job.status = "failed";
      job.error =
        "The provider has not confirmed a result in time. No credits were charged by this website. Please contact support before retrying.";
      job.creditsRefunded = false;
    } else if (
      Date.now() - new Date(job.lastCheckedAt || 0).getTime() >=
      1000
    ) {
      const configuration = videoConfiguration();
      if (!configuration || !job.providerId)
        throw new ApiError(
          503,
          "PROVIDER_UNAVAILABLE",
          "The render provider is temporarily unavailable.",
        );
      job.lastCheckedAt = new Date().toISOString();
      try {
        const checked = providerJobSchema.safeParse(
          await providerJson(
            configuration.url,
            `jobs/${encodeURIComponent(job.providerId)}`,
            { key: configuration.key },
          ),
        );
        if (!checked.success)
          throw new ApiError(
            502,
            "INVALID_PROVIDER_RESPONSE",
            "The provider returned an invalid render status.",
          );
        const update = checked.data;
        if (update.status === "succeeded") {
          if (!update.videoUrl)
            throw new ApiError(
              502,
              "INVALID_PROVIDER_RESPONSE",
              "The provider has not supplied a video URL.",
            );
          const videoUrl = safeResultUrl(update.videoUrl);
          const posterUrl = update.posterUrl ? safeResultUrl(update.posterUrl) : job.posterUrl;
          job.videoUrl = videoUrl;
          job.posterUrl = posterUrl;
        }
        job.status = update.status;
        job.progress = Math.max(
          job.progress,
          Math.min(99, Math.round(update.progress || 0)),
        );
        if (update.status === "failed") {
          job.error =
            "The provider could not generate this video. No credits were charged by this website. Your free attempt is available again; please try another photo.";
          job.creditsRefunded = false;
          job.failureConfirmed = true;
        }
      } catch (error) {
        await writeRecord("jobs", job.id, job);
        throw error;
      }
    }
    if (job.status === "succeeded" || job.status === "failed") {
      job.progress = 100;
      job.completedAt = new Date().toISOString();
    }
    await writeRecord("jobs", job.id, job);
    await releaseFailedAllowance(job);
    if (job.completedAt) await completionEvent(job);
    return publicJob(job);
  });
}
