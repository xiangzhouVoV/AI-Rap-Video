import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(process.env.DATA_DIR || ".data");
const since = new Date(process.argv[2] || Date.now() - 7 * 24 * 60 * 60 * 1000);
if (Number.isNaN(since.getTime()))
  throw new Error("Usage: npm run metrics -- 2026-10-24");

async function records(folder) {
  let names;
  try {
    names = await readdir(path.join(root, folder));
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
  return Promise.all(
    names
      .filter((name) => name.endsWith(".json"))
      .map(async (name) =>
        JSON.parse(await readFile(path.join(root, folder, name), "utf8")),
      ),
  );
}

const events = (await records("events")).filter(
  (item) => new Date(item.createdAt) >= since,
);
const jobs = (await records("jobs")).filter(
  (item) => new Date(item.createdAt) >= since,
);
const visitors = new Set(
  events
    .filter((item) => item.event === "page_view")
    .map((item) => item.session),
);
const uploaders = new Set(
  events
    .filter(
      (item) => item.event === "upload_completed" && visitors.has(item.session),
    )
    .map((item) => item.session),
);
const live = jobs.filter((item) => item.mode === "live");
const succeeded = live.filter((item) => item.status === "succeeded");
const failed = live.filter((item) => item.status === "failed");
const eligible = new Set(succeeded.map((item) => item.owner));
const liveIds = new Set(succeeded.map((item) => item.id));
const modalClicks = new Set(
  events
    .filter(
      (item) =>
        item.event === "checkout_opened" &&
        eligible.has(item.session) &&
        liveIds.has(item.entityId),
    )
    .map((item) => item.session),
);
const rate = (numerator, denominator) =>
  denominator ? Number(((numerator / denominator) * 100).toFixed(2)) : null;

console.log(
  JSON.stringify(
    {
      since: since.toISOString(),
      uploadRate: {
        percent: rate(uploaders.size, visitors.size),
        uploadedSessions: uploaders.size,
        visitedSessions: visitors.size,
      },
      generationSuccessRate: {
        percent: rate(succeeded.length, succeeded.length + failed.length),
        succeeded: succeeded.length,
        failed: failed.length,
        pending: live.length - succeeded.length - failed.length,
        targetPercent: 80,
      },
      paymentModalClickRate: {
        percent: rate(modalClicks.size, eligible.size),
        clickedSessions: modalClicks.size,
        eligibleSessions: eligible.size,
      },
      demo: {
        jobs: jobs.filter((item) => item.mode === "demo").length,
        note: "Demo jobs and their checkout interactions are excluded from generation and payment rates.",
      },
    },
    null,
    2,
  ),
);
