import {
  ApiError,
  apiError,
  checkOrigin,
  getSession,
  json,
  rateLimit,
  readJson,
} from "@/lib/server/http";
import { eventSchema, recordEvent } from "@/lib/server/events";
import { ownedJob } from "@/lib/server/generations";
import { getUpload } from "@/lib/server/uploads";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    checkOrigin(request);
    const session = await getSession(true);
    rateLimit(request, session, "event", 60);
    const event = eventSchema.parse(await readJson(request));
    let entityId: string | undefined;
    let status: string | undefined;
    if (event.event === "upload_completed") {
      if (!event.uploadId)
        throw new ApiError(
          400,
          "UPLOAD_REQUIRED",
          "An uploaded photo is required for this event.",
        );
      await getUpload(event.uploadId, session);
      entityId = event.uploadId;
    } else if (event.event === "generation_completed") {
      if (!event.generationId)
        throw new ApiError(
          400,
          "GENERATION_REQUIRED",
          "A completed render is required for this event.",
        );
      const job = await ownedJob(event.generationId, session);
      if (job.status !== "succeeded" && job.status !== "failed")
        throw new ApiError(
          409,
          "GENERATION_PENDING",
          "The render has not completed.",
        );
      entityId = job.id;
      status = `${job.mode}:${job.status}`;
    } else if (event.event === "checkout_opened" && event.generationId) {
      await ownedJob(event.generationId, session);
      entityId = event.generationId;
    }
    await recordEvent(session.owner, event.event, event.page, entityId, status);
    return json({ recorded: true });
  } catch (error) {
    return apiError(error);
  }
}
