import { json } from "@/lib/server/http";
import {
  checkoutConfiguration,
  videoConfiguration,
} from "@/lib/server/provider";

export const runtime = "nodejs";

export async function GET() {
  const mode = process.env.VIDEO_PROVIDER_URL ? "live" : "demo";
  let generationEnabled = mode === "demo";
  let checkoutEnabled = false;
  try {
    if (videoConfiguration()) generationEnabled = true;
  } catch {
    /* Configuration is intentionally not exposed. */
  }
  try {
    checkoutConfiguration();
    checkoutEnabled = mode === "live" && generationEnabled;
  } catch {
    /* Configuration is intentionally not exposed. */
  }
  return json({ mode, generationEnabled, checkoutEnabled });
}
