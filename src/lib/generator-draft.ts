export const GENERATOR_DRAFT_KEY = "airaptovideo:template-draft";
export const GENERATOR_DRAFT_TTL_MS = 30 * 60 * 1000;

export type GeneratorStyle = "rap" | "dance" | "cinematic" | "crowd";

export type DraftUpload = {
  id: string;
  url: string;
  width: number;
  height: number;
};

export type GeneratorDraft = {
  version: 1;
  createdAt: number;
  targetPath: "/" | "/i-found-you-in-the-crowd";
  style: GeneratorStyle;
  uploads: (DraftUpload | null)[];
};

const styles: readonly GeneratorStyle[] = ["rap", "dance", "cinematic", "crowd"];
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function targetFor(style: GeneratorStyle): GeneratorDraft["targetPath"] {
  return style === "crowd" ? "/i-found-you-in-the-crowd" : "/";
}

function copyUpload(upload: DraftUpload | null): DraftUpload | null {
  return upload
    ? { id: upload.id, url: upload.url, width: upload.width, height: upload.height }
    : null;
}

/** Store only upload references. Consent and generation jobs never travel with a template. */
export function createGeneratorDraft(
  style: GeneratorStyle,
  uploads: readonly (DraftUpload | null)[],
  now = Date.now(),
): GeneratorDraft {
  return {
    version: 1,
    createdAt: now,
    targetPath: targetFor(style),
    style,
    uploads: uploads.slice(0, 2).map(copyUpload),
  };
}

/** Reuse either available portrait for single-photo styles; keep crowd roles in place. */
export function normalizeDraftUploads(
  uploads: readonly (DraftUpload | null)[],
  style: GeneratorStyle,
): (DraftUpload | null)[] {
  if (style !== "crowd") return [copyUpload(uploads[0] ?? uploads[1] ?? null)];
  return Array.from({ length: 2 }, (_, index) =>
    copyUpload(uploads[index] ?? null),
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isUpload(value: unknown): value is DraftUpload {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === "string" &&
    uuid.test(value.id) &&
    value.url === `/api/uploads/${value.id}` &&
    typeof value.width === "number" &&
    Number.isInteger(value.width) &&
    value.width > 0 &&
    value.width <= 2048 &&
    typeof value.height === "number" &&
    Number.isInteger(value.height) &&
    value.height > 0 &&
    value.height <= 2048
  );
}

/** Read an explicit navigation handoff; the caller controls storage and one-time consumption. */
export function parseGeneratorDraft(
  raw: string | null,
  targetPath: string,
  now = Date.now(),
): GeneratorDraft | null {
  if (!raw || raw.length > 4096) return null;
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return null;
  }
  if (
    !isRecord(value) ||
    value.version !== 1 ||
    typeof value.createdAt !== "number" ||
    !Number.isSafeInteger(value.createdAt) ||
    value.createdAt < 0 ||
    value.createdAt > now ||
    now - value.createdAt >= GENERATOR_DRAFT_TTL_MS ||
    typeof value.style !== "string" ||
    !styles.includes(value.style as GeneratorStyle) ||
    value.targetPath !== targetFor(value.style as GeneratorStyle) ||
    value.targetPath !== targetPath ||
    !Array.isArray(value.uploads) ||
    value.uploads.length > 2 ||
    !value.uploads.every((upload) => upload === null || isUpload(upload))
  ) {
    return null;
  }

  return createGeneratorDraft(
    value.style as GeneratorStyle,
    value.uploads as (DraftUpload | null)[],
    value.createdAt,
  );
}
