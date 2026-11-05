import assert from 'node:assert/strict';
import { spawn, type ChildProcess } from 'node:child_process';
import { createHash } from 'node:crypto';
import { once } from 'node:events';
import { cp, mkdtemp, readFile, readdir, rm, symlink } from 'node:fs/promises';
import { createServer, type Server } from 'node:http';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { after, before, describe, it } from 'node:test';
import { setTimeout as delay } from 'node:timers/promises';
import sharp from 'sharp';

const root = process.cwd();
const fixturePath = path.join(root, 'tests', 'fixtures', 'synthetic.heic');
type Json = Record<string, unknown>;
type Upload = { id: string; url: string; width: number; height: number };
type Job = { id: string; status: string; progress: number; mode: string; videoUrl?: string; creditsRefunded?: boolean; error?: string };

async function listen(server: Server): Promise<number> {
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  assert.ok(address && typeof address !== 'string');
  return address.port;
}

async function unusedPort() {
  const server = createServer();
  const port = await listen(server);
  await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  return port;
}

type App = { origin: string; dataDir: string; close: () => Promise<void> };

async function startApp(extraEnv: Record<string, string> = {}): Promise<App> {
  // Copy into a private temporary project so Next's dev lock and generated
  // types cannot interfere with a developer's running server or real data.
  const project = await mkdtemp(path.join(tmpdir(), 'airaptovideo-test-'));
  const dataDir = path.join(project, 'test-data');
  const port = await unusedPort();
  const origin = `http://127.0.0.1:${port}`;
  for (const name of ['src', 'public', 'package.json', 'tsconfig.json', 'next.config.ts', 'next-env.d.ts']) {
    await cp(path.join(root, name), path.join(project, name), { recursive: true });
  }
  await symlink(path.join(root, 'node_modules'), path.join(project, 'node_modules'), 'dir');
  const environment: NodeJS.ProcessEnv = { ...process.env };
  // Never inherit a configured production provider or a checkout credential.
  for (const key of Object.keys(environment)) {
    if (/^(VIDEO_|CHECKOUT_|LIVE_GENERATION_|FREE_VIDEO_|PAID_VIDEO_|NEXT_PUBLIC_|INDEXABLE$|APP_ORIGIN$|DATA_DIR$|NODE_ENV$|PORT$)/.test(key)) delete environment[key];
  }
  Object.assign(environment, {
    NODE_ENV: 'development', NEXT_TELEMETRY_DISABLED: '1',
    APP_ORIGIN: origin, NEXT_PUBLIC_SITE_URL: origin,
    DATA_DIR: dataDir, INDEXABLE: 'false', ...extraEnv,
  });
  const child = spawn(process.execPath, [path.join(root, 'node_modules', 'next', 'dist', 'bin', 'next'), 'dev', project, '--webpack', '--hostname', '127.0.0.1', '--port', String(port)], {
    cwd: project, env: environment, stdio: ['ignore', 'pipe', 'pipe'], detached: process.platform !== 'win32',
  });
  let output = '';
  child.stdout?.on('data', chunk => { output = (output + chunk.toString()).slice(-18_000); });
  child.stderr?.on('data', chunk => { output = (output + chunk.toString()).slice(-18_000); });
  const close = async () => {
    await stopChild(child);
    await rm(project, { recursive: true, force: true });
  };
  try {
    const deadline = Date.now() + 55_000;
    while (Date.now() < deadline) {
      if (child.exitCode !== null) throw new Error(`Next exited before startup: ${output}`);
      try {
        const response = await fetch(`${origin}/api/config`, { signal: AbortSignal.timeout(1000) });
        if (response.ok) return { origin, dataDir, close };
      } catch { /* The initial route compilation may still be in progress. */ }
      await delay(150);
    }
    throw new Error(`Next did not become ready within 55 seconds: ${output}`);
  } catch (error) { await close(); throw error; }
}

async function stopChild(child: ChildProcess) {
  if (child.exitCode !== null || child.signalCode !== null) return;
  const done = once(child, 'exit').catch(() => undefined);
  const signal = (kind: NodeJS.Signals) => {
    try { if (process.platform !== 'win32' && child.pid) process.kill(-child.pid, kind); else child.kill(kind); } catch { /* Already stopped. */ }
  };
  signal('SIGTERM');
  const stopped = await Promise.race([done.then(() => true), delay(5000).then(() => false)]);
  if (!stopped) { signal('SIGKILL'); await done; }
}

class Client {
  cookie = '';
  constructor(readonly app: App) {}
  get owner() { return createHash('sha256').update(this.cookie.split('=')[1]).digest('hex'); }
  async request(route: string, init: RequestInit = {}) {
    const headers = new Headers(init.headers);
    if (this.cookie) headers.set('cookie', this.cookie);
    if (init.method && init.method !== 'GET') headers.set('origin', this.app.origin);
    const response = await fetch(`${this.app.origin}${route}`, { ...init, headers, signal: AbortSignal.timeout(30_000) });
    const cookie = response.headers.get('set-cookie');
    if (cookie) this.cookie = cookie.split(';')[0];
    return response;
  }
  post(route: string, body: unknown) { return this.request(route, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }); }
  async upload(bytes: Buffer, filename = 'portrait.png', type = 'image/png') {
    const form = new FormData();
    form.set('file', new Blob([new Uint8Array(bytes)], { type }), filename);
    return this.request('/api/uploads', { method: 'POST', body: form });
  }
}

async function image(format: 'jpeg' | 'png' | 'webp' = 'png') {
  return sharp({ create: { width: 64, height: 48, channels: 3, background: '#d2fa68' } }).toFormat(format).toBuffer();
}

async function uploadPhoto(client: Client) {
  const response = await client.upload(await image());
  assert.equal(response.status, 201, await response.clone().text());
  return await response.json() as Upload;
}

function generation(uploadIds: string[], overrides: Json = {}) {
  return { uploadIds, style: 'rap', variant: 'solo', aspectRatio: '9:16', duration: 5, model: 'standard', consent: true, ...overrides };
}

async function expectError(response: Response, status: number, code?: string) {
  const body = await response.json() as { error: { code: string; message: string } };
  assert.equal(response.status, status, JSON.stringify(body));
  assert.equal(typeof body.error?.message, 'string');
  if (code) assert.equal(body.error.code, code);
  return body;
}

async function records(app: App, name: string): Promise<Json[]> {
  const folder = path.join(app.dataDir, name);
  const files = await readdir(folder).catch((error: NodeJS.ErrnoException) => error.code === 'ENOENT' ? [] : Promise.reject(error));
  return Promise.all(files.filter(file => file.endsWith('.json')).map(async file => JSON.parse(await readFile(path.join(folder, file), 'utf8')) as Json));
}

function renderedHtml(html: string) { return html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ''); }
function textOnly(html: string) { return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(); }

describe('SSR pages and the complete demo API workflow', { concurrency: false }, () => {
  let app: App;
  let flow: Client;
  let uploads: Upload[];
  let completed: Job;

  before(async () => { app = await startApp(); }, { timeout: 60_000 });
  after(async () => { await app?.close(); });

  it('serves seven complete pages with server-rendered headings, canonical URLs, FAQs, and home links', { timeout: 60_000 }, async () => {
    const pages = [
      { path: '/', heading: /AI rap video generator\./i, faqs: 5 },
      { path: '/i-found-you-in-the-crowd', heading: /I found you in the crowd/i, faqs: 12 },
      { path: '/dance-rap-video', heading: /AI dance rap video/i, faqs: 5 },
      { path: '/rap-video', heading: /AI rap video/i, faqs: 5 },
      { path: '/music-video-generator', heading: /AI music video generator/i, faqs: 5 },
      { path: '/rap-name-generator', heading: /Rap name generator/i, faqs: 5 },
      { path: '/effects/', heading: /AI video effects/i, faqs: 0 },
    ];
    for (const page of pages) {
      const response = await fetch(`${app.origin}${page.path}`);
      assert.equal(response.status, 200, page.path);
      const html = renderedHtml(await response.text());
      const headings = [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/g)];
      assert.equal(headings.length, 1, `one H1 in ${page.path}`);
      assert.match(textOnly(headings[0][1]), page.heading, page.path);
      const canonical = [...html.matchAll(/<link\b[^>]*>/g)].find(match => /rel="canonical"/.test(match[0]));
      assert.ok(canonical, `canonical in ${page.path}`);
      const canonicalUrl = new URL(canonical[0].match(/href="([^\"]+)"/)![1]);
      assert.equal(canonicalUrl.origin, app.origin);
      assert.equal(canonicalUrl.pathname.replace(/\/$/, ''), page.path.replace(/\/$/, ''), canonical[0]);
      assert.match(html, /<meta name="viewport" content="[^\"]*width=device-width[^\"]*"/);
      assert.match(html, /<html lang="en"/);
      assert.equal([...html.matchAll(/<details\b[^>]*class="faq-item"/g)].length, page.faqs, `FAQ count in ${page.path}`);
      const main = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/)?.[1];
      assert.ok(main, `server-rendered main in ${page.path}`);
      assert.match(main, /<a\b[^>]*href="\/"[^>]*>[\s\S]*?AI rap video generator[\s\S]*?<\/a>/i, `keyword home link in ${page.path}`);
      assert.doesNotMatch(textOnly(main), /coming soon/i);
    }
  });

  it('returns a 404 with a single noindex directive for unknown pages and effects', async () => {
    for (const route of ['/ai-rap-video-generator', '/rap-battle-video', '/diss-track-generator', '/fated-gaze', '/effects/i-found-you-in-the-crowd', '/effects/not-an-implemented-effect']) {
      const response = await fetch(`${app.origin}${route}`);
      assert.equal(response.status, 404, route);
      const html = renderedHtml(await response.text());
      const robots = html.match(/<meta\b[^>]*\bname="robots"[^>]*>/gi) ?? [];
      assert.equal(robots.length, 1, `robots tag count for ${route}`);
      assert.match(robots[0], /\bcontent="noindex"/i, route);
      assert.match(html, /<footer\b[^>]*>[\s\S]*?href="mailto:support@airaptovideo\.app"[\s\S]*?<\/footer>/i, route);
    }
  });

  it('reports demo configuration without accidentally enabling checkout', async () => {
    const response = await fetch(`${app.origin}/api/config`);
    assert.deepEqual(await response.json(), { mode: 'demo', generationEnabled: true, checkoutEnabled: false });
  });

  it('decodes JPEG, PNG, WebP, and actual HEIC bytes into private normalized JPEGs', { timeout: 45_000 }, async () => {
    flow = new Client(app);
    uploads = [];
    for (const format of ['jpeg', 'png', 'webp'] as const) {
      const response = await flow.upload(await image(format), `portrait.${format}`, `image/${format}`);
      assert.equal(response.status, 201, await response.clone().text());
      uploads.push(await response.json() as Upload);
    }
    const heic = await readFile(fixturePath);
    assert.equal(heic.toString('ascii', 4, 12), 'ftypheic');
    const converted = await flow.upload(heic, 'iphone.heic', 'image/heic');
    assert.equal(converted.status, 201, await converted.clone().text());
    uploads.push(await converted.json() as Upload);
    assert.deepEqual(uploads.map(upload => [upload.width, upload.height]), [[64, 48], [64, 48], [64, 48], [32, 32]]);
    assert.match(flow.cookie, /^arv_session=[a-f0-9]{64}$/);
    for (const upload of uploads) {
      const response = await flow.request(upload.url);
      assert.equal(response.status, 200);
      assert.equal(response.headers.get('content-type'), 'image/jpeg');
      assert.match(response.headers.get('cache-control') || '', /private, no-store/);
      assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
      const bytes = Buffer.from(await response.arrayBuffer());
      assert.equal((await sharp(bytes).metadata()).format, 'jpeg');
    }
  });

  it('rejects disguised files, oversized images, malformed uploads, and cross-origin writes', async () => {
    const client = new Client(app);
    await expectError(await client.upload(Buffer.from('<svg onload="alert(1)"></svg>'), 'fake.jpg', 'image/jpeg'), 422, 'INVALID_IMAGE');
    await expectError(await client.upload(Buffer.alloc(12 * 1024 * 1024 + 1), 'large.png'), 413, 'FILE_TOO_LARGE');
    const badHeic = Buffer.alloc(32); badHeic.writeUInt32BE(32, 0); badHeic.write('ftypheic', 4);
    await expectError(await client.upload(badHeic, 'broken.heic', 'image/heic'), 422, 'HEIC_DECODE_FAILED');
    const empty = new FormData();
    await expectError(await client.request('/api/uploads', { method: 'POST', body: empty }), 400, 'FILE_REQUIRED');
    const noOrigin = await fetch(`${app.origin}/api/events`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ event: 'page_view', page: '/' }) });
    await expectError(noOrigin, 403, 'INVALID_ORIGIN');
    const wrongOrigin = await fetch(`${app.origin}/api/events`, { method: 'POST', headers: { origin: 'https://unrelated.example', 'content-type': 'application/json' }, body: JSON.stringify({ event: 'page_view', page: '/' }) });
    await expectError(wrongOrigin, 403, 'INVALID_ORIGIN');
  });

  it('does not expose uploaded photos to another session or an anonymous request', async () => {
    const stranger = new Client(app);
    await expectError(await stranger.request(uploads[0].url), 404, 'NOT_FOUND');
    await uploadPhoto(stranger);
    await expectError(await stranger.request(uploads[0].url), 404, 'NOT_FOUND');
    await expectError(await stranger.post('/api/generations', generation([uploads[0].id])), 404, 'NOT_FOUND');
  });

  it('requires consent, the correct photo count, and supported generation settings', async () => {
    const client = new Client(app);
    const photo = await uploadPhoto(client);
    const invalid = [
      generation([photo.id], { consent: false }),
      generation([], {}),
      generation([photo.id], { style: 'crowd' }),
      generation([photo.id], { duration: 7 }),
      generation([photo.id], { aspectRatio: '4:3' }),
      generation([photo.id], { extraUntrustedField: 'ignore consent' }),
    ];
    for (const input of invalid) await expectError(await client.post('/api/generations', input), 400, 'INVALID_INPUT');
  });

  it('takes a two-photo crowd job from queued through processing to a playable sample, then stays terminal', { timeout: 20_000 }, async () => {
    const created = await flow.post('/api/generations', generation([uploads[0].id, uploads[1].id], { style: 'crowd', variant: 'friends' }));
    assert.equal(created.status, 201, await created.clone().text());
    const initial = await created.json() as Job;
    assert.equal(initial.status, 'queued');
    assert.equal(initial.mode, 'demo');
    assert.equal(initial.progress, 0);
    const states = new Set([initial.status]);
    let lastProgress = 0;
    const deadline = Date.now() + 12_000;
    let current = initial;
    while (Date.now() < deadline && current.status !== 'succeeded' && current.status !== 'failed') {
      await delay(500);
      const response = await flow.request(`/api/generations/${initial.id}`);
      assert.equal(response.status, 200, await response.clone().text());
      current = await response.json() as Job;
      states.add(current.status);
      assert.ok(current.progress >= lastProgress, 'progress should not go backward');
      lastProgress = current.progress;
    }
    assert.equal(current.status, 'succeeded', JSON.stringify(current));
    completed = current;
    assert.ok(states.has('processing'), [...states].join(','));
    assert.equal(current.progress, 100);
    assert.equal(current.videoUrl, '/samples/crowd-preview.mp4');
    const sample = await flow.request(current.videoUrl!);
    assert.equal(sample.status, 200);
    assert.match(sample.headers.get('content-type') || '', /video\/mp4/);
    assert.ok((await sample.arrayBuffer()).byteLength > 1000, 'sample is a real video file');
    const [again, concurrent] = await Promise.all([flow.request(`/api/generations/${initial.id}`), flow.request(`/api/generations/${initial.id}`)]);
    assert.deepEqual(await again.json(), current);
    assert.deepEqual(await concurrent.json(), current);
    const events = (await records(app, 'events')).filter(event => event.event === 'generation_completed' && event.entityId === initial.id);
    assert.equal(events.length, 1, 'completion polling records only one conversion event');
    assert.equal(events[0].status, 'demo:succeeded');
  });

  it('validates email, preserves ownership, and does not promise configured delivery', async () => {
    await expectError(await flow.post(`/api/generations/${completed.id}/email`, { email: 'invalid-address' }), 400, 'INVALID_INPUT');
    const response = await flow.post(`/api/generations/${completed.id}/email`, { email: 'TEST@Example.com' });
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { saved: true, deliveryEnabled: false });
    const stored = (await records(app, 'jobs')).find(job => job.id === completed.id);
    assert.equal(stored?.email, 'test@example.com');
    const stranger = new Client(app);
    await uploadPhoto(stranger);
    await expectError(await stranger.request(`/api/generations/${completed.id}`), 404, 'NOT_FOUND');
    await expectError(await stranger.post(`/api/generations/${completed.id}/email`, { email: 'wrong@example.com' }), 404, 'NOT_FOUND');
    const publicResult = await flow.request(`/api/generations/${completed.id}`);
    const body = await publicResult.json();
    assert.ok(!('email' in body) && !('owner' in body) && !('uploadIds' in body));
  });

  it('returns an explicit 503 for checkout instead of collecting a payment in demo mode', async () => {
    const response = await flow.post('/api/checkout', { pack: 'single', generationId: completed.id });
    const body = await expectError(response, 503, 'PAYMENTS_UNAVAILABLE');
    assert.match(body.error.message, /No payment was taken/);
    assert.ok(!('url' in body));
    await expectError(await flow.post('/api/checkout', { pack: 'subscription', generationId: completed.id }), 400, 'INVALID_INPUT');
  });

  it('validates analytics events, verifies entity ownership, and deduplicates repeated events', async () => {
    const client = new Client(app);
    const event = { event: 'page_view', page: '/rap-name-generator' };
    for (let i = 0; i < 2; i++) {
      const response = await client.post('/api/events', event);
      assert.equal(response.status, 200);
      assert.deepEqual(await response.json(), { recorded: true });
    }
    const saved = (await records(app, 'events')).filter(record => record.session === client.owner && record.event === 'page_view');
    assert.equal(saved.length, 1);
    assert.equal(saved[0].page, '/rap-name-generator');
    await expectError(await client.post('/api/events', { event: 'arbitrary_event', page: '/' }), 400, 'INVALID_INPUT');
    await expectError(await client.post('/api/events', { event: 'page_view', page: '/?email=private@example.com' }), 400, 'INVALID_INPUT');
    await expectError(await client.post('/api/events', { event: 'page_view', page: '/', properties: { email: 'private@example.com' } }), 400, 'INVALID_INPUT');
    await expectError(await client.post('/api/events', { event: 'upload_completed', page: '/' }), 400, 'UPLOAD_REQUIRED');
    await expectError(await client.post('/api/events', { event: 'upload_completed', page: '/', uploadId: uploads[0].id }), 404, 'NOT_FOUND');
    await expectError(await client.post('/api/events', { event: 'generation_completed', page: '/', generationId: completed.id }), 404, 'NOT_FOUND');
    const pending = await flow.post('/api/generations', generation([uploads[0].id]));
    assert.equal(pending.status, 201);
    const pendingJob = await pending.json() as Job;
    await expectError(await flow.post('/api/events', { event: 'generation_completed', page: '/', generationId: pendingJob.id }), 409, 'GENERATION_PENDING');
    for (let i = 0; i < 2; i++) assert.equal((await flow.post('/api/events', { event: 'checkout_opened', page: '/i-found-you-in-the-crowd', generationId: completed.id })).status, 200);
    assert.equal((await records(app, 'events')).filter(record => record.event === 'checkout_opened' && record.entityId === completed.id).length, 1);
  });
});

describe('live adapter safeguards against a local mock provider', { concurrency: false }, () => {
  let app: App;
  let mock: Server;
  let estimate = 0.65;
  let nextStatus = 'failed';
  let mockOrigin = '';
  const quoteCalls: Json[] = [];
  const createCalls: { body: Json; idempotencyKey: string | undefined }[] = [];
  const statuses = new Map<string, string>();

  before(async () => {
    mock = createServer(async (request, response) => {
      response.setHeader('content-type', 'application/json');
      try {
        assert.equal(request.headers.authorization, 'Bearer test-only-local-key');
        const chunks: Buffer[] = [];
        for await (const chunk of request) chunks.push(Buffer.from(chunk));
        const body = chunks.length ? JSON.parse(Buffer.concat(chunks).toString()) as Json : {};
        if (request.url === '/quotes' && request.method === 'POST') {
          quoteCalls.push(body);
          response.end(JSON.stringify({ quoteId: `quote-${quoteCalls.length}`, estimatedCostUsd: estimate, currency: 'USD', expiresAt: new Date(Date.now() + 60_000).toISOString() }));
        } else if (request.url === '/jobs' && request.method === 'POST') {
          createCalls.push({ body, idempotencyKey: request.headers['idempotency-key'] as string | undefined });
          const id = `local-job-${createCalls.length}`; statuses.set(id, nextStatus);
          response.end(JSON.stringify({ id }));
        } else if (request.url?.startsWith('/jobs/')) {
          const status = statuses.get(request.url.slice('/jobs/'.length));
          response.end(JSON.stringify({ status, progress: 100, ...(status === 'succeeded' ? { videoUrl: `${mockOrigin}/result.mp4` } : {}) }));
        } else { response.statusCode = 404; response.end('{}'); }
      } catch (error) { response.statusCode = 500; response.end(JSON.stringify({ error: String(error) })); }
    });
    mockOrigin = `http://127.0.0.1:${await listen(mock)}`;
    app = await startApp({ VIDEO_PROVIDER_URL: mockOrigin, VIDEO_PROVIDER_KEY: 'test-only-local-key', LIVE_GENERATION_ENABLED: 'true', FREE_VIDEO_MAX_COST_USD: '0.50', PAID_VIDEO_MAX_COST_USD: '1.50' });
  }, { timeout: 60_000 });
  after(async () => {
    await app?.close();
    if (mock) await new Promise<void>(resolve => { mock.close(() => resolve()); mock.closeAllConnections(); });
  });

  it('rejects a quote above the free cost cap without starting or reserving a render', async () => {
    const client = new Client(app);
    const photo = await uploadPhoto(client);
    await expectError(await client.post('/api/generations', generation([photo.id])), 422, 'COST_CAP_EXCEEDED');
    assert.equal(quoteCalls.length, 1);
    assert.equal(createCalls.length, 0);
    assert.equal(quoteCalls[0].maxCostUsd, 0.5);
    assert.equal(quoteCalls[0].pricingTier, 'free');
    assert.equal((await records(app, 'usage')).length, 0);
    assert.equal((await records(app, 'jobs')).length, 0);

    // A refused estimate must not consume the visitor's first free attempt.
    estimate = 0.30;
    const response = await client.post('/api/generations', generation([photo.id]));
    assert.equal(response.status, 201, await response.clone().text());
    const initial = await response.json() as Job;
    assert.equal(initial.mode, 'live');
    assert.equal(createCalls.length, 1);
    assert.equal(createCalls[0].idempotencyKey, initial.id);
    assert.equal(createCalls[0].body.maxCostUsd, 0.5);
    assert.equal(createCalls[0].body.resolution, '480p');
    assert.equal(createCalls[0].body.watermark, true);
    assert.equal(createCalls[0].body.audio, false);
    const inputs = createCalls[0].body.inputs as { mimeType: string; data: string }[];
    assert.equal(inputs[0].mimeType, 'image/jpeg');
    assert.equal((await sharp(Buffer.from(inputs[0].data, 'base64')).metadata()).format, 'jpeg');
    const statusResponse = await client.request(`/api/generations/${initial.id}`);
    assert.equal(statusResponse.status, 200);
    const failure = await statusResponse.json() as Job;
    assert.equal(failure.status, 'failed');
    assert.equal(failure.progress, 100);
    assert.equal(failure.creditsRefunded, false, 'an external failure must not invent an unconfirmed refund');
    assert.match(failure.error || '', /No credits were charged by this website/);
    assert.deepEqual(await (await client.request(`/api/generations/${initial.id}`)).json(), failure);
    assert.equal(createCalls.length, 1, 'terminal polling never creates an extra provider job');
    assert.equal((await records(app, 'usage')).length, 0, 'a confirmed provider failure releases the free allowance');
    const retry = await client.post('/api/generations', generation([photo.id]));
    assert.equal(retry.status, 201, 'an explicit retry can start after confirmed failure');
    assert.equal(createCalls.length, 2);
    await expectError(await client.post('/api/generations', generation([photo.id])), 402, 'FREE_VIDEO_USED');
    assert.equal(createCalls.length, 2, 'a queued retry holds its allowance against duplicate billing');
  });

  it('accepts a within-cap success and preserves a terminal live result', async () => {
    nextStatus = 'succeeded';
    const client = new Client(app);
    const photo = await uploadPhoto(client);
    const response = await client.post('/api/generations', generation([photo.id]));
    assert.equal(response.status, 201);
    const job = await response.json() as Job;
    const result = await (await client.request(`/api/generations/${job.id}`)).json() as Job;
    assert.equal(result.status, 'succeeded');
    assert.equal(result.progress, 100);
    assert.equal(result.videoUrl, `${mockOrigin}/result.mp4`);
    assert.deepEqual(await (await client.request(`/api/generations/${job.id}`)).json(), result);
    assert.equal((await records(app, 'events')).filter(record => record.entityId === job.id && record.event === 'generation_completed').length, 1);
    const callsAfterSuccess = createCalls.length;
    await expectError(await client.post('/api/generations', generation([photo.id])), 402, 'FREE_VIDEO_USED');
    assert.equal(createCalls.length, callsAfterSuccess);
    await expectError(await client.post('/api/checkout', { pack: 'trio', generationId: job.id }), 503, 'PAYMENTS_UNAVAILABLE');
  });

  it('prevents premium settings from bypassing the free-tier budget before obtaining a quote', async () => {
    const client = new Client(app);
    const photo = await uploadPhoto(client);
    const previousQuotes = quoteCalls.length;
    await expectError(await client.post('/api/generations', generation([photo.id], { model: 'plus' })), 422, 'FREE_TIER_LIMIT');
    await expectError(await client.post('/api/generations', generation([photo.id], { duration: 10 })), 422, 'FREE_TIER_LIMIT');
    assert.equal(quoteCalls.length, previousQuotes);
    const config = await (await fetch(`${app.origin}/api/config`)).json();
    assert.deepEqual(config, { mode: 'live', generationEnabled: true, checkoutEnabled: false });
  });
});
