# Server API and provider adapters

The application runs on the Next.js Node.js runtime. Every API response uses `Cache-Control: no-store`. Copy `.env.example` to `.env.local` and configure the browser's exact `APP_ORIGIN` (including the development port). No provider key is exposed to browser code.

## Honest default behavior

Without `VIDEO_PROVIDER_URL`, uploads are real, but generation is a **demo**: the server advances a sample preview through queued/processing/succeeded and returns `/samples/crowd-preview.mp4`. Uploaded photos are **not** used to create this sample. The sample is silent, is five seconds long regardless of the selectors, and may not match the selected style or aspect ratio. Missing, empty or invalid-MP4-header sample media produces a real failed state. Demo requests incur no provider charge and consume no credits.

Setting a provider URL alone does not enable spending. Live generation additionally requires `LIVE_GENERATION_ENABLED=true`, a valid quote contract, and cost caps within the limits below. The initial live tier supports one Standard, 5-second, 480p watermarked render per anonymous session. Paid render credit accounting is not implemented or enabled. A browser cookie is not a production identity or strong fraud control.

Without a checkout provider, checkout returns 503 and never pretends that a purchase completed. A configured checkout adapter also requires `CHECKOUT_ENABLED=true`. Demo previews are never purchasable. Keep this disabled until the adapter has implemented verified payment notifications, fulfillment, and the credit ledger described below.

## Sessions, limits, and storage

- An opaque, randomly generated `arv_session` cookie is HttpOnly, SameSite=Lax, valid for seven days, and Secure in production. The server stores its SHA-256 hash as the owner, not the raw cookie. Send requests with same-origin cookies.
- Every POST requires an exact matching `Origin` header; cross-site Fetch Metadata is rejected. `APP_ORIGIN` pins the allowed origin; without it, the request scheme and actual HTTP `Host` are compared (not forwarded host headers). Set `APP_ORIGIN` explicitly behind a production proxy. No public CORS allowance is configured. `curl` callers must explicitly supply the origin.
- Upload and generation IDs are random UUIDs. Private photo, render, and email access checks the session owner. Foreign and missing IDs both return 404; a bare photo URL cannot be used to share an uploaded image. Uploaded file names are discarded.
- Per-session and process-wide burst limits apply. Uploads: 20/minute; render creation: 6/10 minutes; status polling: 120/minute; email storage and checkout: 5/minute; analytics: 60/minute. These are a local baseline, not a replacement for edge rate limits, authentication, bot protection, or distributed throttling.
- `.data/` is private and gitignored. It contains normalized uploads, job records, optional emails, free-tier reservations, deduplicated events, and filesystem locks. Set `DATA_DIR` to a private persistent disk directory if required. Files are written with restricted permissions; JSON writes are atomic. Reservations use both process and filesystem locks.
- Use a persistent single-host Node deployment for this storage adapter. Ephemeral/serverless filesystems and independent replicas require replacement with object storage and a shared transactional database/queue before production use. API creation needs a 60-second execution allowance.
- Uploaded photos expire from API access after 24 hours. **Physical deletion is not scheduled by this app.** Configure a retention cleanup job for expired upload metadata and matching JPEGs, plus an explicit retention/deletion policy for jobs, emails, usage, and analytics before handling production traffic. Never mount `.data` beneath `public/` or allow a web server to serve it.
- Keep the same HTTPS host throughout the workflow. An anonymous user loses access to their uploads and renders if their session cookie is deleted or expires. Real accounts, recovery, entitlement delivery, and privacy controls remain launch work.

## Error response

All API errors have this shape, with an appropriate HTTP status:

```json
{ "error": { "code": "INVALID_INPUT", "message": "Please check the request fields." } }
```

Expected status codes include 400 malformed input, 403 origin failure, 404 absent/foreign item, 409 pending/conflicting operation, 413 request too large, 415 unsupported body type, 422 unusable photo/free-tier/cost validation, 429 throttled, 502 upstream failure, and 503 service not enabled. The site does not forward provider error bodies, paths, or secrets to the browser.

## Browser endpoints

### `GET /api/config`

Non-sensitive runtime capability flags:

```json
{ "mode": "demo", "generationEnabled": true, "checkoutEnabled": false }
```

`mode` is `live` when a video adapter URL is configured. An invalid or disabled adapter produces `generationEnabled:false`. Demo generation is enabled by default. The flags disclose no keys, adapter addresses, or detailed configuration errors.

### `POST /api/uploads`

Multipart form data containing exactly one `file` field. Maximum file size: 12 MiB. JPEG, PNG, WebP, HEIC and HEIF are decoded and validated. HEIC/HEIF container dimensions are checked before conversion with `heic-convert`, then processed with `sharp`. Photos are limited to 40 megapixels, auto-oriented, reduced to a maximum 2048-pixel edge, flattened, and re-encoded as JPEG without original metadata. Animated/multi-page WebP is rejected. File extension or MIME type alone never establishes validity.

201 response:

```json
{ "id": "82c8f602-fc41-439f-ae31-264742146ad1", "url": "/api/uploads/82c8f602-fc41-439f-ae31-264742146ad1", "width": 1024, "height": 1536 }
```

### `GET /api/uploads/[id]`

Returns the session-owned normalized JPEG, with private no-store caching and same-origin resource policy. The original file and original metadata are never served.

### `POST /api/generations`

```json
{
  "uploadIds": ["82c8f602-fc41-439f-ae31-264742146ad1"],
  "style": "rap",
  "variant": "solo",
  "aspectRatio": "9:16",
  "duration": 5,
  "model": "standard",
  "consent": true
}
```

Allowed styles: `rap | dance | cinematic | crowd`. Variants: `couple | friends | pets | solo`. Aspect ratios: `9:16 | 16:9 | 1:1`. Duration: numeric `5 | 10`. Models: `standard | plus`. The `crowd` style requires two uploaded photo IDs in balcony-person, spotlight-person order; other styles require one. `consent` must literally be `true`. Unknown fields are rejected, and prompts are composed on the server from allowlisted options. A crowd solo variation may reference the same owned photo twice.

201 returns a public Job. It never includes session ownership, email, provider credentials or provider job IDs:

```json
{
  "id": "b9aa6f28-2e7c-4f5b-8952-dc435aa31544",
  "status": "queued",
  "progress": 0,
  "mode": "demo",
  "style": "rap",
  "variant": "solo",
  "aspectRatio": "9:16",
  "duration": 5,
  "model": "standard",
  "createdAt": "2026-10-24T10:00:00.000Z",
  "posterUrl": "/images/crowd-scene.png"
}
```

### `GET /api/generations/[id]`

Returns the latest public Job. Status is `queued | processing | succeeded | failed`, progress is 0–100, and mode is `demo | live`. Terminal success includes `videoUrl`, optionally `posterUrl`; failure includes a safe `error` and `creditsRefunded:false`. No user credits exist or are charged yet, so the UI must say **no credits charged**, not that a refund was issued. Once a terminal state is persisted, further polling returns that state without another provider request.

Demo progress reaches the sample result after approximately six seconds. Live polling is coalesced to at most one upstream check/second/job. Upstream polling errors return a retryable HTTP error without starting another render. After 20 minutes without a terminal result, the local job fails with a support/reconciliation message. This timeout does not prove that the provider stopped processing; do not blindly create another potentially billable render.

### `POST /api/generations/[id]/email`

```json
{ "email": "you@example.com" }
```

Email format and length are validated. The address is stored privately on the session-owned job and may be replaced by resubmitting. Response:

```json
{ "saved": true, "deliveryEnabled": false }
```

This app sends no email. Show that delivery is not enabled, even after storage succeeds. A transactional email service, consent/retention handling, job completion worker and retry strategy need integration before promising notifications.

### `POST /api/checkout`

```json
{ "pack": "trio", "generationId": "b9aa6f28-2e7c-4f5b-8952-dc435aa31544" }
```

Pack prices are enforced on the server: `single` $7.99 (799 cents), `trio` $19.90 (1990 cents), `party` $49.90 (4990 cents). Currency is USD and mode is a one-time payment, never a subscription. The exact credit quantities, including Party, require a confirmed product decision; the app does not invent or grant a balance. A completed, session-owned **live** job is required, and the payment adapter must be explicitly enabled. Without a configured adapter the response is 503 and no payment is initiated. A valid configured response is:

```json
{ "url": "https://checkout.example.com/session/opaque-id" }
```

A browser return URL or successful session creation does not prove payment and grants no credits or downloads.

### `POST /api/events`

```json
{ "event": "checkout_opened", "page": "/i-found-you-in-the-crowd", "generationId": "b9aa6f28-2e7c-4f5b-8952-dc435aa31544" }
```

Allowed events are `page_view`, `upload_completed`, `generation_completed`, and `checkout_opened`. `page` is a local path without a query/hash. `upload_completed` requires an owned `uploadId`; `generation_completed` requires an owned, terminal `generationId`; a checkout event optionally carries an owned `generationId`. Uploads and terminal generations also record events on the server. Event records are deduplicated by session + event + entity ID, or by session + event + path if no entity exists. Duplicate requests return `{ "recorded": true }` without an extra record. Tracking does not include file names, emails, prompts, arbitrary properties or query strings.

First-week metrics are limited to these three rates:

1. Upload rate = distinct sessions with an `upload_completed` / distinct sessions with a `page_view`.
2. Generation success = succeeded live jobs / terminal live jobs. Demo jobs are marked `demo` and must be excluded; queued jobs are reported separately, not silently counted as success. The target is ≥80%.
3. Payment modal click rate = distinct sessions with `checkout_opened` / distinct sessions with a succeeded live job. Demo modal activity must be reported separately using the referenced job's mode.

Use whole-site/session aggregates initially; server-generated upload and generation events use their tool's canonical page. Do not treat those as exact attribution for every P1 route. Events are private records in `.data/events/`; no public analytics dashboard exposes visitor data.

## Video adapter contract

`VIDEO_PROVIDER_URL` is the base URL of **your adapter**, not necessarily a vendor's existing API. Set `VIDEO_PROVIDER_KEY` for `Authorization: Bearer …`. URLs must be HTTPS; loopback HTTP is allowed only outside production. HTTP redirects are rejected. Provider JSON responses are bounded to 64 KiB. No provider call happens in demo mode.

The adapter must implement all three operations. The site does not guess vendor pricing or start paid work before an enforceable quote is accepted.

### 1. `POST {base}/quotes`

Receives allowlisted style/variant/aspectRatio/duration/model, a server-authored `prompt`, `inputCount`, `audio:false`, `resolution:"480p"`, `watermark:true`, `pricingTier:"free"`, and `maxCostUsd` (default 0.50). No photos are sent for a quote. Return:

```json
{ "quoteId": "quote_opaque_id", "currency": "USD", "estimatedCostUsd": 0.32, "expiresAt": "2026-10-24T10:05:00.000Z" }
```

The quote must represent the **complete maximum charge** for this render, including vendor/upscale/adapter costs. It must be finite, nonnegative, unexpired for at least five seconds and ≤ the configured free cap. The adapter must honor that accepted price as a hard maximum, not merely a best-effort estimate. Otherwise live generation must remain disabled.

`FREE_VIDEO_MAX_COST_USD` defaults to 0.50 and may be lowered but cannot exceed 0.50. `PAID_VIDEO_MAX_COST_USD` defaults to 1.50 and may be lowered but cannot exceed 1.50. Both are validated before live work. The paid cap is reserved for future credit-backed generation; no paid generation path currently exists.

### 2. `POST {base}/jobs`

The same render fields are sent along with `quoteId`, `maxCostUsd`, `pricingTier:"free"`, a UUID `idempotencyKey`, and:

```json
{ "inputs": [{ "id": "upload-uuid", "mimeType": "image/jpeg", "data": "BASE64_JPEG_BYTES" }] }
```

The server sends only the consented, normalized photos, never public photo URLs or original metadata. The adapter must treat this data as private, enforce the quote and cost ceiling, and support both the JSON idempotency key and the matching `Idempotency-Key` header. Return `{ "id": "provider-job-id" }`. The create request timeout is 30 seconds; quote/poll timeouts are 15 seconds. The site never automatically retries job creation.

An anonymous first-free reservation is persisted **before** job creation. An explicit provider terminal `failed` response releases that job's reservation so the user can retry. If creation times out, its response is ambiguous, or polling times out without a confirmed provider failure, the reservation remains used to avoid duplicate spending. Operators must reconcile the idempotency key at the provider before manually releasing such a reservation. Local reservations are not user monetary credits, and no customer refund is claimed.

### 3. `GET {base}/jobs/{encoded-provider-id}`

Return:

```json
{ "status": "processing", "progress": 46 }
```

Or a final result:

```json
{ "status": "succeeded", "progress": 100, "videoUrl": "https://media.example.com/private-signed-video.mp4", "posterUrl": "https://media.example.com/private-signed-poster.jpg" }
```

`videoUrl` is mandatory for success. Use expiring, unguessable signed HTTPS URLs with appropriate download/CORS policies; no credentials in URLs. Result URLs are validated before being exposed. `data:`, `javascript:`, `file:`, insecure production HTTP, malformed URLs, and HTTP basic-auth URLs are rejected. Failed jobs return `{ "status": "failed" }`; provider text is not shown to visitors.

## Checkout adapter contract and remaining payment work

`CHECKOUT_PROVIDER_URL` is your adapter base URL. `CHECKOUT_PROVIDER_KEY` authenticates with a Bearer header. `POST {base}/sessions` receives:

```json
{
  "pack": "trio",
  "mode": "payment",
  "currency": "usd",
  "amountCents": 1990,
  "generationId": "local-job-uuid",
  "providerGenerationId": "provider-job-id",
  "customerReference": "hashed-session-owner",
  "fulfillment": "watermark-free-hd-download",
  "successUrl": "https://your-domain.example/?checkout=return",
  "cancelUrl": "https://your-domain.example/?checkout=cancelled"
}
```

`Idempotency-Key` is stable for a generation/pack pair. Return `{ "url": "https://secure-payment-host.example/session/id" }`. The server validates the URL protocol and rejects redirects during the adapter API call. Implement an allowlist for payment-host domains inside your adapter.

Before enabling checkout, integrate and verify: payment-provider account and products; exact credit quantities; signed/replay-safe webhook handling; a durable transactional credit ledger; one-time fulfillment idempotency; real HD/watermark-free rendering and download entitlements; handling refunds/disputes; customer recovery and support. **This repository does not implement these vendor-specific capabilities.** Keep `CHECKOUT_ENABLED=false` until they exist. Session creation and return-page parameters cannot substitute for webhook verification.

## Minimum production checklist

- Choose video/payment vendors and implement/test the adapter contracts, including real HEIC device samples and provider failure/timeout cases.
- Validate actual free and paid generation costs, and enforce caps in the adapter as well as this app. Keep live work off until pricing guarantees are confirmed.
- Replace local storage when deploying without a durable single-host disk; add worker/queue reconciliation for jobs even when the browser closes.
- Add production authentication/abuse controls, appropriate privacy/terms and support contact, retention cleanup, email delivery, and account/payment recovery.
- Verify signed output URL lifetime, download headers, mobile Safari playback and real 480p/HD/watermark behavior.
- Set `APP_ORIGIN` and `NEXT_PUBLIC_SITE_URL` to the real HTTPS origin, then enable `INDEXABLE=true` only when the public site and actual service are ready.
