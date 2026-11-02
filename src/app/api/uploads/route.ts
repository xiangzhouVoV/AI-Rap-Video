import {
  apiError,
  checkOrigin,
  getSession,
  json,
  rateLimit,
  readBody,
  ApiError,
} from "@/lib/server/http";
import { recordEvent } from "@/lib/server/events";
import { MAX_UPLOAD_BYTES, saveUpload } from "@/lib/server/uploads";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    checkOrigin(request);
    const session = await getSession(true);
    rateLimit(request, session, "upload", 20);
    const contentType = request.headers.get("content-type") || "";
    if (!contentType.toLowerCase().startsWith("multipart/form-data;"))
      throw new ApiError(
        415,
        "UNSUPPORTED_CONTENT_TYPE",
        "Upload a photo using multipart/form-data.",
      );
    const body = await readBody(request, MAX_UPLOAD_BYTES + 65_536);
    let form: FormData;
    try {
      form = await new Response(new Uint8Array(body), {
        headers: { "Content-Type": contentType },
      }).formData();
    } catch {
      throw new ApiError(
        400,
        "INVALID_MULTIPART",
        "This upload could not be read. Please choose the photo again.",
      );
    }
    const file = form.get("file");
    if (!(file instanceof File) || form.getAll("file").length !== 1)
      throw new ApiError(400, "FILE_REQUIRED", "Choose one photo to upload.");
    const upload = await saveUpload(file, session);
    await recordEvent(session.owner, "upload_completed", "/", upload.id);
    return json(upload, 201);
  } catch (error) {
    return apiError(error);
  }
}
