import {
  apiError,
  checkOrigin,
  getSession,
  json,
  rateLimit,
  readJson,
} from "@/lib/server/http";
import { createGeneration, generationSchema } from "@/lib/server/generations";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    checkOrigin(request);
    const session = await getSession();
    rateLimit(request, session, "generation-create", 6, 10 * 60_000);
    const input = generationSchema.parse(await readJson(request));
    return json(await createGeneration(input, session), 201);
  } catch (error) {
    return apiError(error);
  }
}
