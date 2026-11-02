import "server-only";
import { randomUUID } from "node:crypto";
import { readFile, writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { ApiError, type Session } from "./http";
import { directory, readRecord, validId, writeRecord } from "./storage";

export const MAX_UPLOAD_BYTES = 12 * 1024 * 1024;
const MAX_PIXELS = 40_000_000;
const RETENTION_MS = 24 * 60 * 60 * 1000;

export type UploadRecord = {
  id: string;
  owner: string;
  width: number;
  height: number;
  createdAt: string;
  expiresAt: string;
};

function isHeif(buffer: Buffer) {
  if (buffer.length < 16 || buffer.toString("ascii", 4, 8) !== "ftyp")
    return false;
  const header = buffer.toString("ascii", 8, Math.min(buffer.length, 80));
  return /heic|heix|hevc|hevx|heim|heis|mif1|msf1/.test(header);
}

function checkHeifDimensions(buffer: Buffer) {
  let dimensionsFound = false;
  function inspect(start: number, end: number, depth: number) {
    if (depth > 5) return;
    for (let offset = start; offset + 8 <= end; ) {
      let size = buffer.readUInt32BE(offset);
      const type = buffer.toString("ascii", offset + 4, offset + 8);
      let header = 8;
      if (size === 1) {
        if (offset + 16 > end) throw new Error("Invalid HEIF box");
        const large = buffer.readBigUInt64BE(offset + 8);
        if (large > BigInt(buffer.length)) throw new Error("Invalid HEIF size");
        size = Number(large);
        header = 16;
      } else if (size === 0) size = end - offset;
      if (size < header || offset + size > end)
        throw new Error("Invalid HEIF box");
      if (type === "ispe") {
        if (size < header + 12) throw new Error("Invalid HEIF dimensions");
        const width = buffer.readUInt32BE(offset + header + 4);
        const height = buffer.readUInt32BE(offset + header + 8);
        if (!width || !height || width * height > MAX_PIXELS)
          throw new Error("HEIF pixel limit exceeded");
        dimensionsFound = true;
      } else if (["meta", "iprp", "ipco"].includes(type)) {
        inspect(
          offset + header + (type === "meta" ? 4 : 0),
          offset + size,
          depth + 1,
        );
      }
      offset += size;
    }
  }
  inspect(0, buffer.length, 0);
  if (!dimensionsFound) throw new Error("Missing HEIF dimensions");
}

export async function saveUpload(file: File, session: Session) {
  if (!file.size)
    throw new ApiError(400, "EMPTY_FILE", "Choose a photo to upload.");
  if (file.size > MAX_UPLOAD_BYTES)
    throw new ApiError(
      413,
      "FILE_TOO_LARGE",
      "Photos must be 12 MB or smaller.",
    );
  let input = Buffer.from(await file.arrayBuffer());
  // Check decoded bytes, not just a browser-provided MIME type or extension.
  if (isHeif(input)) {
    try {
      checkHeifDimensions(input);
      const convert = (await import("heic-convert")).default;
      input = Buffer.from(
        await convert({ buffer: input, format: "JPEG", quality: 0.9 }),
      );
    } catch {
      throw new ApiError(
        422,
        "HEIC_DECODE_FAILED",
        "This HEIC photo could not be read. Export it as JPEG or try another photo.",
      );
    }
  }
  let output: Buffer;
  let width: number;
  let height: number;
  try {
    const image = sharp(input, {
      limitInputPixels: MAX_PIXELS,
      failOn: "error",
      animated: false,
    });
    const metadata = await image.metadata();
    if (
      !metadata.format ||
      !["jpeg", "png", "webp"].includes(metadata.format) ||
      !metadata.width ||
      !metadata.height ||
      (metadata.pages || 1) > 1
    ) {
      throw new Error("Unsupported image");
    }
    const encoded = await image
      .rotate()
      .resize({
        width: 2048,
        height: 2048,
        fit: "inside",
        withoutEnlargement: true,
      })
      .flatten({ background: "#f4f0eb" })
      .jpeg({ quality: 88, mozjpeg: true })
      .toBuffer({ resolveWithObject: true });
    output = encoded.data;
    width = encoded.info.width;
    height = encoded.info.height;
  } catch {
    throw new ApiError(
      422,
      "INVALID_IMAGE",
      "Use a readable JPEG, PNG, WebP, HEIC or HEIF photo up to 40 megapixels.",
    );
  }
  const id = randomUUID();
  const record: UploadRecord = {
    id,
    owner: session.owner,
    width,
    height,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + RETENTION_MS).toISOString(),
  };
  const target = path.join(await directory("uploads"), `${id}.jpg`);
  await writeFile(target, output, { mode: 0o600 });
  try {
    await writeRecord("uploads", id, record);
  } catch (error) {
    await unlink(target).catch(() => undefined);
    throw error;
  }
  return { id, url: `/api/uploads/${id}`, width, height };
}

export async function getUpload(
  id: string,
  session: Session,
): Promise<UploadRecord> {
  const record = await readRecord<UploadRecord>("uploads", validId(id));
  if (
    !record ||
    record.owner !== session.owner ||
    new Date(record.expiresAt).getTime() <= Date.now()
  ) {
    throw new ApiError(
      404,
      "NOT_FOUND",
      "This photo has expired or was not found in your session. Please upload it again.",
    );
  }
  return record;
}

export async function uploadBytes(id: string, session: Session) {
  await getUpload(id, session);
  try {
    return await readFile(path.join(await directory("uploads"), `${id}.jpg`));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT")
      throw new ApiError(
        404,
        "NOT_FOUND",
        "This photo is no longer available. Please upload it again.",
      );
    throw error;
  }
}
