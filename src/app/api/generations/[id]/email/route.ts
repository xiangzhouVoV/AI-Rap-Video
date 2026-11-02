import { z } from "zod";
import {
  apiError,
  checkOrigin,
  getSession,
  json,
  rateLimit,
  readJson,
} from "@/lib/server/http";
import { ownedJob } from "@/lib/server/generations";
import { withLock, writeRecord } from "@/lib/server/storage";

export const runtime = "nodejs";
const schema = z
  .object({
    email: z
      .email()
      .max(254)
      .transform((value) => value.toLowerCase()),
  })
  .strict();

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    checkOrigin(request);
    const session = await getSession();
    rateLimit(request, session, "email-save", 5);
    const { email } = schema.parse(await readJson(request));
    const { id } = await context.params;
    await withLock(`job:${id}`, async () => {
      const job = await ownedJob(id, session);
      job.email = email;
      job.emailSavedAt = new Date().toISOString();
      await writeRecord("jobs", id, job);
    });
    return json({ saved: true, deliveryEnabled: false });
  } catch (error) {
    return apiError(error);
  }
}
