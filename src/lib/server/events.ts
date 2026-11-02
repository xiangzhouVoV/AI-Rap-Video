import "server-only";
import { createHash } from "node:crypto";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { directory } from "./storage";

export const eventSchema = z
  .object({
    event: z.enum([
      "page_view",
      "upload_completed",
      "generation_completed",
      "checkout_opened",
    ]),
    page: z
      .string()
      .max(180)
      .regex(
        /^\/(?:[a-zA-Z0-9_/-]*)$/,
        "Use a website path without query parameters.",
      ),
    uploadId: z.string().uuid().optional(),
    generationId: z.string().uuid().optional(),
  })
  .strict();

export async function recordEvent(
  owner: string,
  event: z.infer<typeof eventSchema>["event"],
  page: string,
  entityId?: string,
  status?: string,
) {
  const key = createHash("sha256")
    .update(`${owner}:${event}:${entityId || page}`)
    .digest("hex");
  const record = {
    event,
    page,
    session: owner,
    entityId,
    status,
    createdAt: new Date().toISOString(),
  };
  try {
    await writeFile(
      path.join(await directory("events"), `${key}.json`),
      JSON.stringify(record),
      { flag: "wx", mode: 0o600 },
    );
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
  }
}
