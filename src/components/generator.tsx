"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  ArrowDown,
  ArrowDownToLine,
  ArrowRight,
  ArrowUpRight,
  Camera,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  Clapperboard,
  Clock3,
  Film,
  ImagePlus,
  Loader2,
  LockKeyhole,
  Mail,
  Music2,
  Play,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Upload,
  VolumeX,
  X,
} from "lucide-react";
import { styles, variants } from "@/lib/content";
import { creditPackIds, creditPacks, formatPackPrice, type CreditPackId } from "@/lib/credit-packs";
import TemplateControl from "./template-control";
import {
  GENERATOR_DRAFT_KEY,
  createGeneratorDraft,
  normalizeDraftUploads,
  parseGeneratorDraft,
  type GeneratorStyle,
} from "@/lib/generator-draft";

type UploadResult = { id: string; url: string; width: number; height: number };
type Job = {
  id: string;
  status: "queued" | "processing" | "succeeded" | "failed";
  progress: number;
  mode: "demo" | "live";
  videoUrl?: string;
  posterUrl?: string;
  error?: string;
  creditsRefunded?: boolean;
};
type Props = {
  mode?: "rap" | "crowd";
  initialStyle?: string;
  heading?: ReactNode;
  showStyles?: boolean;
  showVariants?: boolean;
};

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const abort = () => controller.abort();
  init?.signal?.addEventListener("abort", abort, { once: true });
  if (init?.signal?.aborted) controller.abort();
  const timeout = setTimeout(abort, 45_000);
  try {
    const response = await fetch(url, { ...init, signal: controller.signal });
    const data = await response.json().catch(() => { throw new Error("The service could not respond. Please try again."); });
    if (!response.ok) throw new Error(typeof data.error === "string" ? data.error : data.error?.message || "Something went wrong. Please try again.");
    return data as T;
  } catch (error) {
    if (controller.signal.aborted && !init?.signal?.aborted) throw new Error("The request took too long. Check your connection and try again.");
    throw error;
  } finally {
    clearTimeout(timeout);
    init?.signal?.removeEventListener("abort", abort);
  }
}

function track(
  event: string,
  properties: Record<string, string | number | boolean> = {},
) {
  void fetch("/api/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      event,
      page: window.location.pathname,
      ...(properties.generationId
        ? { generationId: properties.generationId }
        : {}),
    }),
    keepalive: true,
  }).catch(() => {});
}

export default function Generator({
  mode = "rap",
  initialStyle = "rap",
  heading,
  showStyles = false,
  showVariants = false,
}: Props) {
  const crowd = mode === "crowd";
  const [uploads, setUploads] = useState<(UploadResult | null)[]>(
    crowd ? [null, null] : [null],
  );
  const [uploading, setUploading] = useState<number | null>(null);
  const [style, setStyle] = useState(crowd ? "crowd" : initialStyle);
  const [variant, setVariant] = useState("couple");
  const [consent, setConsent] = useState(false);
  const [aspectRatio, setAspectRatio] = useState("9:16");
  const [duration, setDuration] = useState(5);
  const [model, setModel] = useState("standard");
  const [job, setJob] = useState<Job | null>(null);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");
  const [pricing, setPricing] = useState(false);
  const [email, setEmail] = useState("");
  const [emailSaved, setEmailSaved] = useState(false);
  const [emailSaving, setEmailSaving] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [deliveryEnabled, setDeliveryEnabled] = useState(false);
  const [demoMode, setDemoMode] = useState(true);
  const [generationEnabled, setGenerationEnabled] = useState(true);
  const [checkoutEnabled, setCheckoutEnabled] = useState(false);
  const [pollVersion, setPollVersion] = useState(0);
  const [samplePlaying, setSamplePlaying] = useState(false);
  const [templateNotice, setTemplateNotice] = useState("");
  const sparePhoto = useRef<UploadResult | null>(null);
  const skipJobRestore = useRef(false);
  const files = useRef<(HTMLInputElement | null)[]>([]);
  const cameras = useRef<(HTMLInputElement | null)[]>([]);
  const formRef = useRef<HTMLFormElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const running = job?.status === "queued" || job?.status === "processing";
  const selectedVariant = variants.find((item) => item.id === variant);

  useEffect(() => {
    let active = true;
    try {
      const draft = parseGeneratorDraft(sessionStorage.getItem(GENERATOR_DRAFT_KEY), window.location.pathname);
      if (draft) {
        skipJobRestore.current = true;
        setStyle(draft.style);
        const nextUploads = normalizeDraftUploads(draft.uploads, draft.style);
        setUploads(nextUploads);
        if (draft.style !== "crowd") sparePhoto.current = draft.uploads[0] ? draft.uploads[1] || null : null;
        setConsent(false);
        setJob(null);
        if (nextUploads.some(Boolean)) {
          setTemplateNotice(draft.style === "crowd"
            ? nextUploads.every(Boolean)
              ? "Your photos are ready. Check who is on the balcony and who is in the spotlight."
              : nextUploads[0]
                ? "Your photo is in the balcony slot. Add the person in the crowd to complete the scene."
                : "Your crowd photo is ready. Add the person on the balcony to complete the scene."
            : "Your photo is ready. Review the template, then click Generate when you’re ready.");
        }
        sessionStorage.removeItem(GENERATOR_DRAFT_KEY);
        sessionStorage.removeItem(`airaptovideo:job:${window.location.pathname}`);
      }
    } catch { /* The form still works when optional browser storage is unavailable. */ }
    void request<{ mode: "demo" | "live"; generationEnabled: boolean; checkoutEnabled: boolean }>(
      "/api/config",
    )
      .then((config) => {
        if (!active) return;
        setDemoMode(config.mode === "demo");
        setGenerationEnabled(config.generationEnabled);
        setCheckoutEnabled(config.checkoutEnabled);
        if (skipJobRestore.current) return;
        const lastId = sessionStorage.getItem(
          `airaptovideo:job:${window.location.pathname}`,
        );
        if (lastId)
          void request<Job>(`/api/generations/${lastId}`)
            .then((result) => {
              if (active && !skipJobRestore.current) setJob(result);
            })
            .catch(() =>
              sessionStorage.removeItem(
                `airaptovideo:job:${window.location.pathname}`,
              ),
            );
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    try {
      const key = `airaptovideo:job:${window.location.pathname}`;
      if (job) sessionStorage.setItem(key, job.id);
    } catch {
      /* Rendering still works when browser storage is unavailable. */
    }
  }, [job?.id]);

  useEffect(() => {
    if (!job || !running) return;
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout>;
    let attempts = 0;
    const poll = async () => {
      try {
        const result = await request<Job>(`/api/generations/${job.id}`, {
          signal: controller.signal,
        });
        setJob(result);
        attempts = 0;
        if (result.status === "queued" || result.status === "processing")
          timer = setTimeout(poll, 1800);
      } catch (caught) {
        if (controller.signal.aborted) return;
        attempts++;
        if (attempts < 4) timer = setTimeout(poll, 2500 * attempts);
        else
          setError(
            "We lost the connection. Your render may still be running. Check its status below.",
          );
      }
    };
    timer = setTimeout(poll, 800);
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [job?.id, running, pollVersion]);

  function resetJob() {
    skipJobRestore.current = true;
    setJob(null);
    try { sessionStorage.removeItem(`airaptovideo:job:${window.location.pathname}`); } catch { /* Optional browser storage. */ }
  }

  function selectStyle(nextStyle: string) {
    if (running || starting || uploading !== null) return;
    setStyle(nextStyle);
    setError("");
    setTemplateNotice(uploads.some(Boolean) ? "Template updated. Your photo is ready to use." : "");
    resetJob();
  }

  function selectVariant(nextVariant: string) {
    if (running || starting || uploading !== null) return;
    setVariant(nextVariant);
    setError("");
    setTemplateNotice(uploads.some(Boolean) ? "Scene updated. Your photos stay in their current roles." : "");
    resetJob();
  }

  function prepareTemplateNavigation(nextStyle: string) {
    if (running || starting || uploading !== null) return false;
    try {
      const photos = crowd ? uploads : [uploads[0], sparePhoto.current];
      sessionStorage.setItem(GENERATOR_DRAFT_KEY, JSON.stringify(createGeneratorDraft(nextStyle as GeneratorStyle, photos)));
      return true;
    } catch {
      setError("We couldn’t carry your photo to another page. Allow browser storage or finish with the current template.");
      return false;
    }
  }

  async function upload(file: File | undefined, index: number) {
    if (!file || uploading !== null || running || starting) return;
    setError("");
    if (file.size > 12 * 1024 * 1024) {
      setError("Choose a photo smaller than 12 MB.");
      return;
    }
    setUploading(index);
    try {
      const data = new FormData();
      data.append("file", file);
      const result = await request<UploadResult>("/api/uploads", {
        method: "POST",
        body: data,
      });
      setUploads((previous) =>
        previous.map((item, i) => (i === index ? result : item)),
      );
      setTemplateNotice("");
      resetJob();
    } catch (caught) {
      setError((caught as Error).message);
    } finally {
      setUploading(null);
      if (files.current[index]) files.current[index]!.value = "";
      if (cameras.current[index]) cameras.current[index]!.value = "";
    }
  }

  async function generate(event?: React.FormEvent) {
    event?.preventDefault();
    if (starting || running || uploading !== null) return;
    setError("");
    if (uploads.some((item) => !item)) {
      setError(
        crowd
          ? "Add both photos to create your scene."
          : "Add a photo to start your video.",
      );
      return;
    }
    if (!consent) {
      setError("Please confirm you have permission to use these photos.");
      return;
    }
    setStarting(true);
    setEmailSaved(false);
    try {
      const result = await request<Job>("/api/generations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uploadIds: uploads.map((item) => item!.id),
          style,
          variant: crowd ? variant : "solo",
          aspectRatio,
          duration,
          model,
          consent,
        }),
      });
      setJob(result);
    } catch (caught) {
      setError((caught as Error).message);
    } finally {
      setStarting(false);
    }
  }

  async function saveEmail(event: React.FormEvent) {
    event.preventDefault();
    if (!job) return;
    setEmailSaving(true);
    setEmailError("");
    try {
      const result = await request<{
        saved: boolean;
        deliveryEnabled: boolean;
      }>(`/api/generations/${job.id}/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setEmailSaved(result.saved);
      setDeliveryEnabled(result.deliveryEnabled);
    } catch (caught) {
      setEmailError((caught as Error).message);
    } finally {
      setEmailSaving(false);
    }
  }

  function openPricing() {
    setPricing(true);
    track("checkout_opened", {
      generationId: job?.id || "",
      mode: job?.mode || "demo",
    });
  }

  const tool = (
    <div className="tool-card" id="create">
      <div className="tool-card-top">
        <span>
          <Sparkles size={14} /> YOUR CREATIVE SPACE
        </span>
        <span className="free-pill">
          First video free <span>↗</span>
        </span>
      </div>
      {running ? (
        <div className="render-state" aria-live="polite">
          <div className="render-orbit">
            <Sparkles size={28} />
            <span />
          </div>
          <span className="eyebrow">
            {job.mode === "demo" ? "SAMPLE PREVIEW" : "MAKING YOUR MOMENT"}
          </span>
          <h2>
            {job.progress < 30
              ? "Setting the scene…"
              : job.progress < 75
                ? "A little movie magic…"
                : "The finishing touches…"}
          </h2>
          <p className="muted">
            {job.mode === "demo"
              ? "Explore the full workflow with a sample clip. AI generation is not connected in this preview."
              : "You can keep this page open while your video renders."}
          </p>
          <div className="progress-meta">
            <span>
              {job.status === "queued" ? "In the queue" : "Rendering video"}
            </span>
            <strong>{job.progress}%</strong>
          </div>
          <div
            className="progress-track"
            role="progressbar"
            aria-label="Video generation progress"
            aria-valuenow={job.progress}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <span style={{ width: `${job.progress}%` }} />
          </div>
          <form className="email-form" onSubmit={saveEmail}>
            <label htmlFor="render-email">
              <Mail size={15} /> Leave an email for this video{" "}
              <span>optional</span>
            </label>
            {emailSaved ? (
              <p className="saved-message">
                <CheckCircle2 size={15} />{" "}
                {deliveryEnabled
                  ? "Email saved for this video."
                  : "Email saved. Email delivery isn’t enabled in this preview."}
              </p>
            ) : (
              <div className="email-input-row">
                <input
                  id="render-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  autoComplete="email"
                />
                <button type="submit" disabled={emailSaving}>
                  {emailSaving ? (
                    <Loader2 className="spin" size={16} />
                  ) : (
                    <ArrowRight size={18} />
                  )}
                  <span className="sr-only">Save email</span>
                </button>
              </div>
            )}
            {emailError && <p className="inline-error">{emailError}</p>}
          </form>
          {error && (
            <>
              <p className="inline-error" role="alert">
                {error}
              </p>
              <button
                className="button-secondary"
                type="button"
                onClick={async () => {
                  setError("");
                  try {
                    setJob(await request<Job>(`/api/generations/${job.id}`));
                    setPollVersion((value) => value + 1);
                  } catch (caught) {
                    setError((caught as Error).message);
                  }
                }}
              >
                Check render status
              </button>
            </>
          )}
        </div>
      ) : job?.status === "succeeded" ? (
        <div className="result-state" aria-live="polite">
          <div className="success-label">
            <CheckCircle2 size={16} />{" "}
            {job.mode === "demo" ? "SAMPLE READY" : "IT’S YOUR MOMENT"}
          </div>
          <h2>
            {job.mode === "demo"
              ? "Your preview is ready."
              : "You look good in motion."}
          </h2>
          <div className="result-video">
            <video
              src={job.videoUrl}
              poster={job.posterUrl}
              controls
              playsInline
              preload="metadata"
            />
            <span className="video-watermark">
              airaptovideo · {job.mode === "demo" ? "sample" : "preview"}
            </span>
          </div>
          <p className="result-note">
            {job.mode === "demo"
              ? "5-second sample · your photos and selected settings weren’t used to create this clip."
              : "Your free preview includes a watermark. Get the clean, high-definition version below."}
          </p>
          <button
            className="button-primary generate-button"
            type="button"
            onClick={openPricing}
          >
            <ArrowDownToLine size={17} /> Download HD · no watermark{" "}
            <ArrowUpRight size={16} />
          </button>
          <div className="result-actions">
            {job.videoUrl && (
              <a
                href={job.videoUrl}
                download={
                  job.mode === "demo"
                    ? "airaptovideo-sample.mp4"
                    : "airaptovideo-preview.mp4"
                }
              >
                <ArrowDown size={14} />{" "}
                {job.mode === "demo"
                  ? "Download sample"
                  : "Free watermarked preview"}
              </a>
            )}
            <button
              type="button"
              onClick={() => {
                resetJob();
                setError("");
              }}
            >
              <RotateCcw size={13} /> Make another
            </button>
          </div>
        </div>
      ) : job?.status === "failed" ? (
        <div className="render-state failure-state" role="alert">
          <div className="failure-symbol">
            <RotateCcw size={28} />
          </div>
          <span className="eyebrow">LET’S GIVE IT ANOTHER TAKE</span>
          <h2>This render didn’t make it.</h2>
          <p className="muted">
            {job.error ||
              "Something interrupted the render. Try a clear, well-lit photo and give it another go."}
          </p>
          <p className="refund-note">
            <ShieldCheck size={16} />{" "}
            {job.creditsRefunded
              ? "Your credits have been returned."
              : "No credits were charged for this attempt."}
          </p>
          <button
            className="button-primary"
            type="button"
            onClick={() => uploads.every(Boolean) ? generate() : resetJob()}
            disabled={starting}
          >
            <RotateCcw size={16} /> {uploads.every(Boolean) ? "Retry generation" : "Choose photos to try again"}
          </button>
          <button
            className="text-link"
            type="button"
            onClick={() => resetJob()}
          >
            Change photos or settings
          </button>
          {error && <p className="inline-error">{error}</p>}
        </div>
      ) : (
        <form onSubmit={generate} ref={formRef}>
          <TemplateControl
            style={style}
            variant={variant}
            disabled={starting || uploading !== null}
            onSelectStyle={selectStyle}
            onSelectVariant={selectVariant}
            onNavigate={prepareTemplateNavigation}
          />
          {templateNotice && <p className="template-notice" role="status">{templateNotice}</p>}
          <div className={`upload-grid ${crowd ? "two-uploads" : ""}`}>
            {uploads.map((photo, index) => (
              <div
                key={index}
                className={`upload-box ${photo ? "has-photo" : ""} ${crowd ? `scene-upload scene-${index}` : ""}`}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault();
                  void upload(event.dataTransfer.files[0], index);
                }}
              >
                {(crowd || photo) && (
                  <img
                    src={photo?.url || "/images/crowd-scene.jpg"}
                    alt={
                      photo
                        ? `Your uploaded ${crowd ? (index === 0 ? "balcony" : "crowd") : "portrait"} photo`
                        : index === 0
                          ? "Style preview: a person on a balcony at night"
                          : "Style preview: a person in a crowd under a spotlight"
                    }
                    className={`upload-photo ${photo ? "user-photo" : ""}`}
                  />
                )}
                {photo && (
                  <button
                    className="remove-photo"
                    type="button"
                    disabled={starting || uploading !== null}
                    aria-label={`Remove photo ${index + 1}`}
                    onClick={() => {
                      setTemplateNotice("");
                      setUploads((previous) =>
                        previous.map((item, i) => (i === index ? null : item)),
                      );
                    }}
                  >
                    <X size={14} />
                  </button>
                )}
                <input
                  ref={(element) => {
                    files.current[index] = element;
                  }}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif"
                  className="sr-only"
                  aria-label={
                    crowd
                      ? index === 0
                        ? "Upload the person on the balcony"
                        : "Upload the person in the crowd"
                      : "Upload your photo"
                  }
                  onChange={(event) =>
                    void upload(event.target.files?.[0], index)
                  }
                  disabled={starting || uploading !== null}
                />
                <input
                  ref={(element) => {
                    cameras.current[index] = element;
                  }}
                  type="file"
                  accept="image/*"
                  capture="user"
                  className="sr-only"
                  aria-label={`Take photo ${index + 1}`}
                  onChange={(event) =>
                    void upload(event.target.files?.[0], index)
                  }
                  disabled={starting || uploading !== null}
                />
                <div className="upload-content">
                  <button
                    className="upload-trigger"
                    type="button"
                    disabled={starting || uploading !== null}
                    onClick={() => files.current[index]?.click()}
                  >
                    <span className="upload-icon">
                      {uploading === index ? (
                        <Loader2 className="spin" size={22} />
                      ) : photo ? (
                        <Check size={22} />
                      ) : (
                        <ImagePlus size={23} />
                      )}
                    </span>
                    <strong>
                      {uploading === index
                        ? "Preparing your photo…"
                        : photo
                          ? "Photo added"
                          : crowd
                            ? index === 0
                              ? "The balcony person"
                              : "The person in the crowd"
                            : "Start with your photo"}
                    </strong>
                    <span>
                      {photo
                        ? "Tap to change photo"
                        : crowd
                          ? "Upload a photo"
                          : "Drop it here or click to upload"}
                    </span>
                  </button>
                  <button
                    className="camera-button"
                    type="button"
                    onClick={() => cameras.current[index]?.click()}
                    disabled={starting || uploading !== null}
                  >
                    <Camera size={12} /> Take a photo
                  </button>
                </div>
                {!crowd && !photo && (
                  <span className="upload-format">
                    JPG, PNG, WEBP, HEIC · UP TO 12 MB
                  </span>
                )}
                {crowd && <span className="scene-number">0{index + 1}</span>}
              </div>
            ))}
          </div>
          {crowd && (
            <p className="variant-hint">
              <Sparkles size={12} />
              <span>
                <strong>{selectedVariant?.title} scene</strong> ·{" "}
                {selectedVariant?.description}
              </span>
            </p>
          )}
          <label className="consent-label">
            <input
              type="checkbox"
              checked={consent}
              onChange={(event) => setConsent(event.target.checked)}
            />
            <span>
              I have permission to use {crowd ? "both photos" : "this photo"}{" "}
              and the people in {crowd ? "them" : "it"} have agreed.
            </span>
          </label>
          <div className="settings-grid">
            <label>
              <span>Format</span>
              <div className="select-wrapper">
                <Film size={13} />
                <select
                  aria-label="Aspect ratio"
                  value={aspectRatio}
                  onChange={(event) => setAspectRatio(event.target.value)}
                >
                  <option value="9:16">9:16 · Vertical</option>
                  <option value="16:9">16:9 · Landscape</option>
                  <option value="1:1">1:1 · Square</option>
                </select>
                <ChevronDown size={12} />
              </div>
            </label>
            <label>
              <span>Duration</span>
              <div className="select-wrapper">
                <Clock3 size={13} />
                <select
                  aria-label="Duration"
                  value={duration}
                  onChange={(event) => setDuration(Number(event.target.value))}
                >
                  <option value={5}>5 seconds</option>
                  <option value={10} disabled={!demoMode}>10 seconds{!demoMode ? " · paid" : ""}</option>
                </select>
                <ChevronDown size={12} />
              </div>
            </label>
            <label>
              <span>Model</span>
              <div className="select-wrapper">
                <Sparkles size={13} />
                <select
                  aria-label="Generation model"
                  value={model}
                  onChange={(event) => setModel(event.target.value)}
                >
                  <option value="standard">Standard</option>
                  <option value="plus" disabled={!demoMode}>Plus{!demoMode ? " · paid" : ""}</option>
                </select>
                <ChevronDown size={12} />
              </div>
            </label>
          </div>
          {error && (
            <p className="inline-error" role="alert">
              <CircleHelp size={14} /> {error}
            </p>
          )}
          <button
            className="button-primary generate-button"
            type="submit"
            disabled={starting || uploading !== null || !generationEnabled}
          >
            {starting ? (
              <Loader2 className="spin" size={17} />
            ) : (
              <Sparkles size={17} />
            )}
            <span>
              {starting
                ? "Setting things in motion…"
                : generationEnabled
                  ? "Generate · first free"
                  : "Generation temporarily unavailable"}
            </span>
            <ArrowRight size={17} />
          </button>
          <div className="spec-line">
            <span>
              <Check size={12} /> 480p free preview
            </span>
            <span>
              <Check size={12} />{" "}
              {crowd ? "Silent video" : "Style-based motion"}
            </span>
            <span>
              <Check size={12} /> No subscription
            </span>
          </div>
          {process.env.NEXT_PUBLIC_PAYMENTS_LIVE !== "true" && (
            <p className="demo-disclosure">
              <span /> Interactive preview · AI generation and payments aren’t
              connected yet.
            </p>
          )}
        </form>
      )}
    </div>
  );

  return (
    <>
      <div className={`generator-layout ${crowd ? "crowd-layout" : ""}`}>
        <div className="generator-left">
          {heading}
          {!crowd && tool}
          {crowd && (
            <div className="crowd-intro-note">
              <span className="note-mark">↗</span>
              <p>
                Two photos.
                <br />
                <strong>One unmistakable moment.</strong>
              </p>
              <span className="tiny-label">MADE FOR YOUR STORY</span>
            </div>
          )}
        </div>
        {crowd ? (
          tool
        ) : (
          <div className="preview-stage">
            <img
              src={
                styles.find((item) => item.id === style)?.image ||
                "/images/style-rap.jpg"
              }
              alt="Cinematic portrait style preview for your AI rap video"
              className="preview-image"
            />
            <div className="preview-top">
              <span className="preview-chip">
                <span /> THE MAIN CHARACTER CUT
              </span>
              <span className="preview-format">9:16</span>
            </div>
            <div className="preview-center">
              <span className="preview-kicker">LESS ORDINARY.</span>
              <p>
                More
                <br />
                you<span> in motion.</span>
              </p>
            </div>
            <div className="preview-bottom">
              <div className="preview-track">
                <span>
                  <Music2 size={15} />
                </span>
                <div>
                  <strong>
                    {styles.find((item) => item.id === style)?.title ||
                      "Rap performance"}
                  </strong>
                  <small>Style preview · make it yours</small>
                </div>
              </div>
              <a
                className="preview-play"
                href="#create"
                aria-label="Upload a photo to try this style"
              >
                <ArrowUpRight size={20} />
              </a>
            </div>
            <div className="preview-side-label">
              YOUR PHOTO HAS A WHOLE OTHER SIDE.
            </div>
          </div>
        )}
      </div>
      {showStyles && (
        <section
          className="section styles-section"
          aria-labelledby="styles-heading"
        >
          <div className="section-heading">
            <div>
              <p className="eyebrow">THE VIBE IS YOURS</p>
              <h2 id="styles-heading">Pick your main character energy.</h2>
            </div>
            <p className="muted">Same you. A whole new scene.</p>
          </div>
          <div className="style-grid">
            {styles.map((item, index) =>
              item.id === "crowd" ? (
                <Link
                  className="style-card crowd-style-card"
                  href="/i-found-you-in-the-crowd"
                  key={item.id}
                  aria-disabled={!!running || starting || uploading !== null}
                  onNavigate={(event) => {
                    if (!prepareTemplateNavigation("crowd")) event.preventDefault();
                  }}
                >
                  <img
                    src={item.image}
                    alt="I Found You in the Crowd scene preview"
                    loading="lazy"
                  />
                  <span className="card-tag">{item.tag}</span>
                  <div className="style-card-bottom">
                    <div>
                      <small>0{index + 1} / THE CONNECTION</small>
                      <h3>{item.title}</h3>
                    </div>
                    <span className="card-arrow">
                      <ArrowUpRight size={18} />
                    </span>
                  </div>
                </Link>
              ) : (
                <button
                  type="button"
                  key={item.id}
                  className={`style-card ${style === item.id ? "selected" : ""}`}
                  aria-pressed={style === item.id}
                  disabled={!!running || starting || uploading !== null}
                  onClick={() => selectStyle(item.id)}
                >
                  <img
                    src={item.image}
                    alt={`${item.title} visual style`}
                    loading="lazy"
                  />
                  <span className="card-tag">
                    {style === item.id ? (
                      <>
                        <Check size={11} /> SELECTED
                      </>
                    ) : (
                      item.tag
                    )}
                  </span>
                  <div className="style-card-bottom">
                    <div>
                      <small>
                        0{index + 1} /{" "}
                        {item.id === "rap"
                          ? "THE PERFORMANCE"
                          : item.id === "dance"
                            ? "THE MOVEMENT"
                            : "THE MOVIE"}
                      </small>
                      <h3>{item.title}</h3>
                    </div>
                    <span className="card-arrow">
                      {style === item.id ? (
                        <Check size={17} />
                      ) : (
                        <ArrowUpRight size={18} />
                      )}
                    </span>
                  </div>
                </button>
              ),
            )}
          </div>
        </section>
      )}
      {showVariants && (
        <>
          <section className="section sample-section">
            <div className="sample-copy">
              <p className="eyebrow">THE MOMENT, IN MOTION</p>
              <h2>
                When the whole crowd
                <br />
                fades into the background.
              </h2>
              <p className="muted">
                A balcony. A beam of light. The look that says everything. Try
                this scene with a partner, a friend, your pet, or just yourself.
              </p>
              <span className="sample-caption">
                <VolumeX size={15} /> Silent style preview · not a generated
                result
              </span>
            </div>
            <div className="sample-player">
              <video
                src="/samples/crowd-preview.mp4"
                poster="/images/crowd-scene.jpg"
                controls={samplePlaying}
                playsInline
                preload="none"
                onPlay={() => setSamplePlaying(true)}
                ref={videoRef}
              />
              {!samplePlaying && (
                <button
                  type="button"
                  className="sample-play-button"
                  aria-label="Play sample scene"
                  onClick={() => {
                    setSamplePlaying(true);
                    void videoRef.current
                      ?.play()
                      .catch(() => setSamplePlaying(false));
                  }}
                >
                  <Play size={21} fill="currentColor" />
                </button>
              )}
              <span className="sample-badge">STYLE PREVIEW · 5 SEC</span>
            </div>
          </section>
          <section className="section variants-section">
            <div className="section-heading">
              <div>
                <p className="eyebrow">MAKE THE STORY YOURS</p>
                <h2>Who did you find?</h2>
              </div>
              <p className="muted">Choose a scene. We’ll set the mood.</p>
            </div>
            <div className="variant-grid">
              {variants.map((item, index) => (
                <button
                  type="button"
                  key={item.id}
                  aria-pressed={variant === item.id}
                  disabled={!!running || starting || uploading !== null}
                  className={`variant-card ${variant === item.id ? "selected" : ""}`}
                  onClick={() => {
                    selectVariant(item.id);
                    formRef.current?.scrollIntoView({
                      behavior: "smooth",
                      block: "center",
                    });
                  }}
                >
                  <span className="variant-number">0{index + 1}</span>
                  <span className="variant-emoji">
                    {["♡", "✌", "♧", "✧"][index]}
                  </span>
                  <div>
                    <h3>{item.title}</h3>
                    <p>{item.description}</p>
                  </div>
                  <span className="variant-select">
                    {variant === item.id ? (
                      <Check size={15} />
                    ) : (
                      <ArrowUpRight size={15} />
                    )}
                  </span>
                </button>
              ))}
            </div>
          </section>
        </>
      )}
      {pricing && (
        <PricingModal
          generationId={job?.id}
          demo={job?.mode !== "live"}
          checkoutEnabled={checkoutEnabled}
          onClose={() => setPricing(false)}
        />
      )}
    </>
  );
}

function PricingModal({
  generationId,
  demo,
  checkoutEnabled,
  onClose,
}: {
  generationId?: string;
  demo: boolean;
  checkoutEnabled: boolean;
  onClose: () => void;
}) {
  const [pack, setPack] = useState<CreditPackId>("trio");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const dialogRef = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = dialogRef.current;
    dialog?.showModal();
    return () => {
      dialog?.close();
    };
  }, []);
  async function checkout() {
    setBusy(true);
    setError("");
    try {
      const result = await request<{ url: string }>("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pack, generationId }),
      });
      window.location.assign(result.url);
    } catch (caught) {
      setError((caught as Error).message);
      setBusy(false);
    }
  }
  return (
    <dialog
      className="pricing-modal"
      ref={dialogRef}
      onCancel={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      aria-labelledby="pricing-title"
    >
      <button
        className="modal-close"
        type="button"
        aria-label="Close pricing"
        onClick={onClose}
      >
        <X size={20} />
      </button>
      <p className="eyebrow">KEEP YOUR MOMENT. LOSE THE WATERMARK.</p>
      <h2 id="pricing-title">Your video, ready for its close-up.</h2>
      <p className="muted">
        One-time credit packs. No subscription. Pick your pack first.
      </p>
      <div className="pack-grid">
        {creditPackIds.map((id) => (
          <button
            type="button"
            key={id}
            onClick={() => setPack(id)}
            aria-pressed={pack === id}
            className={`pack-card ${pack === id ? "selected" : ""}`}
          >
            {id === "trio" && (
              <span className="pack-badge">A LITTLE MORE ROOM TO PLAY</span>
            )}
            <span className="pack-name">
              {creditPacks[id].name}
              <span className="pack-radio">
                {pack === id && <Check size={12} />}
              </span>
            </span>
            <strong>{formatPackPrice(creditPacks[id].amountCents)}</strong>
            <span className="pack-once">one-time payment</span>
            <p>{creditPacks[id].detail}</p>
          </button>
        ))}
      </div>
      <div className="pack-benefits">
        <span>
          <Check size={14} /> High-definition download
        </span>
        <span>
          <Check size={14} /> No watermark
        </span>
        <span>
          <Check size={14} /> One-time purchase
        </span>
      </div>
      {demo && (
        <p className="preview-payment-note">
          <LockKeyhole size={15} /> This is a sample preview. Checkout and
          credit purchases aren’t enabled.
        </p>
      )}
      {error && (
        <p className="inline-error" role="alert">
          {error}
        </p>
      )}
      <button
        className="button-primary generate-button"
        type="button"
        disabled={busy || demo || !checkoutEnabled}
        onClick={checkout}
      >
        {busy ? (
          <Loader2 className="spin" size={16} />
        ) : (
          <LockKeyhole size={16} />
        )}
        <span>
          {demo
            ? "Checkout unavailable in preview"
            : !checkoutEnabled ? "Checkout is not connected yet" : `Continue with ${creditPacks[pack].name}`}
        </span>
        <ArrowRight size={17} />
      </button>
      <p className="pricing-footnote">
        Your free preview is still yours to download.
      </p>
    </dialog>
  );
}
