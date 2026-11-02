import { apiError, getSession } from "@/lib/server/http";
import { uploadBytes } from "@/lib/server/uploads";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const bytes = await uploadBytes(id, await getSession());
    return new Response(new Uint8Array(bytes), {
      headers: {
        "Content-Type": "image/jpeg",
        "Content-Length": String(bytes.byteLength),
        "Content-Disposition": "inline; filename=photo.jpg",
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
        "Cross-Origin-Resource-Policy": "same-origin",
      },
    });
  } catch (error) {
    return apiError(error);
  }
}
