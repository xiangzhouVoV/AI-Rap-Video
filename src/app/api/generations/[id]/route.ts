import { apiError, getSession, json, rateLimit } from "@/lib/server/http";
import { refreshGeneration } from "@/lib/server/generations";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession();
    rateLimit(request, session, "generation-poll", 120);
    return json(await refreshGeneration((await context.params).id, session));
  } catch (error) {
    return apiError(error);
  }
}
