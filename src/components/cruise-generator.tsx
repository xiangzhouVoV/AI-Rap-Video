"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowDownToLine, ArrowUpRight, AudioLines, Check, ChevronDown, ExternalLink, Film, ImagePlus, Loader2, RefreshCw, SlidersHorizontal, Sparkles, Upload, X } from "lucide-react";
import ui from "./cruise-generator.module.css";

const storagePrefix = "airaptovideo:24k-magic:task:v1";
const loginUrl = "/login?returnTo=%2Feffects%2F24k-magic%23cruise-create";
const defaultPrompt = "Create a cinematic, energetic cruise-deck dance video featuring the person in the reference photo. Preserve their facial identity and recognizable appearance. Follow the dance movement and lively rhythm of the reference video, with natural full-body motion, consistent anatomy, and confident performance. Place the subject on an open cruise ship deck with ocean views and warm golden-hour lighting. Keep the person clearly framed throughout the clip. Generate fitting rhythmic audio. No added text, captions, or logos.";
type Kind = "photo" | "video" | "audio";
type Asset = { id: string; kind: Kind; url: string; externalReady?: boolean; warning?: string };
type Config = {
  userId: string;
  template: { id: string; name: string; prompt: string; model: string; duration: number; resolution: string; aspectRatio: string; generateAudio: boolean; referenceVideoUrl: string | null };
  capabilities: { generationEnabled: boolean; uploadsPublic: boolean; reason?: string };
};
type Job = {
  id: string;
  status: "submitting" | "processing" | "succeeded" | "failed" | "canceled" | "refunded" | "expired" | "submission_unknown";
  providerTaskId?: string;
  estimatedCredits?: number;
  consumedCredits?: number;
  refundedCredits?: number;
  videoUrl?: string;
  error?: string;
  createdAt: string;
  updatedAt: string;
};
type SavedTask = { version: 1; requestId: string; jobId?: string };
type GenerationBody = {
  templateId: "24k-magic"; requestId: string;
  photoId?: string; photoUrl?: string;
  referenceVideoId?: string; referenceVideoUrl?: string;
  referenceAudioId?: string; referenceAudioUrl?: string;
  prompt: string; duration: number; resolution: string; aspectRatio: string; generateAudio: boolean;
};

class RequestError extends Error {
  constructor(message: string, public status?: number) { super(message); }
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const timeout = AbortSignal.timeout(65_000);
  const response = await fetch(url, { ...init, signal: init?.signal ? AbortSignal.any([init.signal, timeout]) : timeout, cache: "no-store" });
  const data = await response.json().catch(() => { throw new RequestError("The server returned an unreadable response. Check the task before starting another generation.", response.status); });
  if (!response.ok) throw new RequestError(typeof data.error === "string" ? data.error : data.error?.message || "The request could not be completed.", response.status);
  return data as T;
}

function httpsUrl(value: string, label: string) {
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "https:" || url.username || url.password || /(^|\.)(tiktok\.com|youtube\.com|youtu\.be|instagram\.com)$/i.test(url.hostname)) throw new Error();
    return url.href;
  } catch { throw new Error(`${label}: use a direct HTTPS media URL, not a social-media page link.`); }
}

async function checkReferenceFile(file: File, kind: "video" | "audio") {
  const metadata = await new Promise<{ duration: number; width?: number; height?: number }>((resolve, reject) => {
    const media = document.createElement(kind);
    const objectUrl = URL.createObjectURL(file);
    const timeout = setTimeout(() => finish(new Error("The browser could not inspect this reference in time. Try an MP4 video or MP3 audio file.")), 15_000);
    function finish(error?: Error) {
      const result = {
        duration: media.duration,
        ...(media instanceof HTMLVideoElement ? { width: media.videoWidth, height: media.videoHeight } : {}),
      };
      clearTimeout(timeout);
      media.onloadedmetadata = null;
      media.onerror = null;
      media.removeAttribute("src");
      media.load();
      URL.revokeObjectURL(objectUrl);
      if (error) reject(error);
      else resolve(result);
    }
    media.preload = "metadata";
    media.onloadedmetadata = () => finish();
    media.onerror = () => finish(new Error("The browser could not inspect this reference. Try an MP4 video or MP3 audio file, or use a direct HTTPS URL."));
    media.src = objectUrl;
    media.load();
  });
  if (!Number.isFinite(metadata.duration) || metadata.duration < 2 || metadata.duration > 15) {
    throw new Error(`The ${kind} reference must be 2–15 seconds long.${Number.isFinite(metadata.duration) ? ` This file is ${metadata.duration.toFixed(2)} seconds.` : " Its duration could not be read."}`);
  }
  if (kind === "video" && ![480, 720].includes(Math.min(metadata.width || 0, metadata.height || 0))) {
    throw new Error(`The reference video's shorter side must be 480 or 720 pixels. This file is ${metadata.width || 0} × ${metadata.height || 0} pixels.`);
  }
}

function videoDownloadUrl(value: string) {
  const url = new URL(value, "https://download.invalid");
  url.searchParams.set("download", "1");
  return value.startsWith("/") ? `${url.pathname}${url.search}${url.hash}` : url.href;
}

function readSavedTask(key: string): SavedTask | null {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "null");
    const validId = /^[0-9a-f-]{36}$/i;
    return value?.version === 1 && typeof value.requestId === "string" && validId.test(value.requestId) && (value.jobId === undefined || typeof value.jobId === "string" && validId.test(value.jobId)) ? value : null;
  } catch { return null; }
}

const terminal = (status: Job["status"]) => ["succeeded", "failed", "canceled", "refunded", "expired"].includes(status);
const statusLabels: Record<Job["status"], string> = {
  submitting: "Submitting to SeeAPI", processing: "Generating your video", submission_unknown: "Submission needs checking",
  succeeded: "Your video is ready", failed: "Generation failed", canceled: "Task canceled", refunded: "Task refunded", expired: "Task expired",
};

export default function CruiseGenerator() {
  const [config, setConfig] = useState<Config | null>(null);
  const [configError, setConfigError] = useState("");
  const [loginRequired, setLoginRequired] = useState(false);
  const [configVersion, setConfigVersion] = useState(0);
  const [sources, setSources] = useState<Record<Kind, "upload" | "url">>({ photo: "upload", video: "upload", audio: "url" });
  const [assets, setAssets] = useState<Partial<Record<Kind, Asset>>>({});
  const [urls, setUrls] = useState<Record<Kind, string>>({ photo: "", video: "", audio: "" });
  const [previews, setPreviews] = useState<Record<Kind, string>>({ photo: "", video: "", audio: "" });
  const [names, setNames] = useState<Partial<Record<Kind, string>>>({});
  const [uploading, setUploading] = useState<Kind | null>(null);
  const [prompt, setPrompt] = useState(defaultPrompt);
  const [duration, setDuration] = useState(10);
  const [resolution, setResolution] = useState("720p");
  const [aspectRatio, setAspectRatio] = useState("9:16");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState("");
  const [job, setJob] = useState<Job | null>(null);
  const [savedTask, setSavedTask] = useState<SavedTask | null>(null);
  const [starting, setStarting] = useState(false);
  const [checking, setChecking] = useState(false);
  const [paused, setPaused] = useState(false);
  const [taskError, setTaskError] = useState("");
  const [missingTask, setMissingTask] = useState(false);
  const promptEdited = useRef(false);
  const submittedBody = useRef<GenerationBody | null>(null);
  const savedRef = useRef<SavedTask | null>(null);
  const storageKey = useRef<string | null>(null);
  const photoInput = useRef<HTMLInputElement>(null);
  const videoInput = useRef<HTMLInputElement>(null);
  const audioInput = useRef<HTMLInputElement>(null);
  const active = starting || !!job && !terminal(job.status) || !!savedTask && !job;
  const editingDisabled = active || uploading !== null;
  const photoPreview = sources.photo === "upload" ? assets.photo?.url : previews.photo;
  const videoPreview = sources.video === "upload" ? assets.video?.url : previews.video;
  const audioPreview = sources.audio === "upload" ? assets.audio?.url : previews.audio;

  function rememberTask(task: SavedTask) {
    if (!storageKey.current) throw new Error("Sign in before starting a generation.");
    try { localStorage.setItem(storageKey.current, JSON.stringify(task)); }
    catch { throw new Error("Enable browser storage before starting so this task can be recovered safely."); }
    savedRef.current = task;
    setSavedTask(task);
  }

  function acceptJob(nextJob: Job) {
    setJob(nextJob);
    if (savedRef.current) {
      const next = { ...savedRef.current, jobId: nextJob.id };
      savedRef.current = next;
      setSavedTask(next);
      try { if (storageKey.current) localStorage.setItem(storageKey.current, JSON.stringify(next)); } catch { /* The request ID was already stored before submission. */ }
    }
    setTaskError("");
    setMissingTask(false);
    setPaused(false);
  }

  useEffect(() => {
    const controller = new AbortController();
    let mounted = true;
    setConfigError("");
    setLoginRequired(false);
    setConfig(null);
    storageKey.current = null;
    savedRef.current = null;
    setSavedTask(null);
    setJob(null);
    setMissingTask(false);
    void request<Config>("/api/templates/24k-magic", { signal: controller.signal }).then(async (value) => {
      if (!mounted) return;
      setConfig(value);
      storageKey.current = `${storagePrefix}:${value.userId}`;
      const stored = readSavedTask(storageKey.current);
      savedRef.current = stored;
      setSavedTask(stored);
      if (!promptEdited.current) setPrompt(value.template.prompt);
      if (value.template.referenceVideoUrl) {
        setSources((previous) => ({ ...previous, video: "url" }));
        setUrls((previous) => ({ ...previous, video: value.template.referenceVideoUrl! }));
        setPreviews((previous) => ({ ...previous, video: value.template.referenceVideoUrl! }));
      }
      if (stored) {
        setChecking(true);
        try {
          const result = await request<{ job: Job }>(`/api/template-generations/${encodeURIComponent(stored.jobId || stored.requestId)}`, { signal: controller.signal });
          if (mounted) acceptJob(result.job);
        } catch (caught) {
          if (mounted) { setTaskError((caught as Error).message); setPaused(true); setMissingTask(caught instanceof RequestError && caught.status === 404); }
        } finally { if (mounted) setChecking(false); }
      }
    }).catch((caught) => {
      if (!mounted) return;
      setConfig(null);
      setLoginRequired(caught instanceof RequestError && caught.status === 401);
      setConfigError((caught as Error).message);
    });
    return () => { mounted = false; controller.abort(); };
  }, [configVersion]);

  useEffect(() => {
    if (!job || terminal(job.status) || job.status === "submission_unknown" || paused || starting) return;
    const controller = new AbortController();
    let mounted = true;
    const timer = setTimeout(() => {
      void request<{ job: Job }>(`/api/template-generations/${encodeURIComponent(job.id)}`, { signal: controller.signal }).then((result) => {
        if (mounted) acceptJob(result.job);
      }).catch((caught) => {
        if (mounted) {
          setPaused(true);
          setTaskError(`Status checking paused. ${(caught as Error).message}`);
          setMissingTask(caught instanceof RequestError && caught.status === 404);
          if (caught instanceof RequestError && caught.status === 401) setLoginRequired(true);
        }
      });
    }, 10_000);
    return () => { mounted = false; clearTimeout(timer); controller.abort(); };
  }, [job, paused, starting]);

  async function upload(file: File | undefined, kind: Kind) {
    if (!file || editingDisabled) return;
    setError("");
    if (kind === "photo" && !/^image\/(jpeg|png|webp)$/.test(file.type)) { setError("Choose a JPG, PNG, or WebP photo."); return; }
    if (kind === "video" && !/\.(mp4|mov)$/i.test(file.name)) { setError("Choose an MP4 or MOV reference clip."); return; }
    setUploading(kind);
    try {
      if (kind !== "photo") await checkReferenceFile(file, kind);
      const body = new FormData();
      body.append("file", file);
      body.append("kind", kind);
      const result = await request<{ asset: Asset; externalReady?: boolean; warning?: string }>("/api/template-media", { method: "POST", body });
      setAssets((previous) => ({ ...previous, [kind]: { ...result.asset, externalReady: result.externalReady ?? result.asset.externalReady, warning: result.warning ?? result.asset.warning } }));
      setNames((previous) => ({ ...previous, [kind]: file.name }));
      setSources((previous) => ({ ...previous, [kind]: "upload" }));
    } catch (caught) {
      if (caught instanceof RequestError && caught.status === 401) setLoginRequired(true);
      setError((caught as Error).message);
    } finally { setUploading(null); }
  }

  function preview(kind: Kind) {
    try { const url = httpsUrl(urls[kind], `${kind} URL`); setPreviews((previous) => ({ ...previous, [kind]: url })); setError(""); }
    catch (caught) { setError((caught as Error).message); }
  }

  function changeUrl(kind: Kind, value: string) {
    setUrls((previous) => ({ ...previous, [kind]: value }));
    setPreviews((previous) => ({ ...previous, [kind]: "" }));
  }

  function removeAsset(kind: Kind) {
    setAssets((previous) => ({ ...previous, [kind]: undefined }));
    setNames((previous) => ({ ...previous, [kind]: undefined }));
  }

  function mediaFields(kind: Kind, required: boolean): Record<string, string> {
    const field = kind === "photo" ? "photo" : kind === "video" ? "referenceVideo" : "referenceAudio";
    if (sources[kind] === "url") {
      if (!urls[kind].trim() && !required) return {};
      return { [`${field}Url`]: httpsUrl(urls[kind], `${kind} URL`) };
    }
    const asset = assets[kind];
    if (!asset) { if (required) throw new Error(`Add your ${kind === "photo" ? "photo" : "reference video"} before starting.`); return {}; }
    if (!(asset.externalReady ?? config?.capabilities.uploadsPublic)) throw new Error(`The uploaded ${kind} is not accessible to SeeAPI yet. Use a public HTTPS media URL in the debug settings.`);
    return { [`${field}Id`]: asset.id };
  }

  async function generate(event: React.FormEvent) {
    event.preventDefault();
    if (editingDisabled || !config?.capabilities.generationEnabled) return;
    setError("");
    let body: GenerationBody;
    try {
      if (!consent) throw new Error("Confirm that you have permission to use the photo and reference material.");
      if (!prompt.trim()) throw new Error("Add a generation prompt.");
      body = { templateId: "24k-magic", requestId: crypto.randomUUID(), ...mediaFields("photo", true), ...mediaFields("video", true), ...mediaFields("audio", false), prompt: prompt.trim(), duration, resolution, aspectRatio, generateAudio: true };
      rememberTask({ version: 1, requestId: body.requestId });
    } catch (caught) { setError((caught as Error).message || "Browser storage is needed to recover this task safely."); return; }
    submittedBody.current = body;
    setStarting(true);
    setJob(null);
    setTaskError("");
    setPaused(false);
    setMissingTask(false);
    try {
      const result = await request<{ job: Job }>("/api/template-generations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      acceptJob(result.job);
    } catch (caught) {
      if (caught instanceof RequestError && [400, 401, 403, 404, 413, 415, 422, 429].includes(caught.status || 0)) {
        setError(caught.message);
        if (caught.status === 401) setLoginRequired(true);
        try { if (storageKey.current) localStorage.removeItem(storageKey.current); } catch { /* No task was accepted. */ }
        savedRef.current = null;
        setSavedTask(null);
        submittedBody.current = null;
      } else { setTaskError(`The submission response was not confirmed. ${(caught as Error).message}`); setPaused(true); }
    } finally { setStarting(false); }
  }

  async function checkTask() {
    const task = savedRef.current;
    const id = job?.id || task?.jobId || task?.requestId;
    if (!id || checking || starting) return;
    setChecking(true);
    setTaskError("");
    try { const result = await request<{ job: Job }>(`/api/template-generations/${encodeURIComponent(id)}`); acceptJob(result.job); }
    catch (caught) {
      setTaskError((caught as Error).message);
      setPaused(true);
      setMissingTask(caught instanceof RequestError && caught.status === 404);
      if (caught instanceof RequestError && caught.status === 401) setLoginRequired(true);
    }
    finally { setChecking(false); }
  }

  async function retrySubmission() {
    const body = submittedBody.current;
    if (!body || starting || checking || job) return;
    setStarting(true);
    setTaskError("");
    try {
      const result = await request<{ job: Job }>("/api/template-generations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      acceptJob(result.job);
    } catch (caught) { setTaskError((caught as Error).message); setPaused(true); }
    finally { setStarting(false); }
  }

  function clearMissingTask() {
    if (!missingTask) return;
    try { if (storageKey.current) localStorage.removeItem(storageKey.current); }
    catch { setTaskError("The recovery record could not be cleared. Check your browser storage settings."); return; }
    savedRef.current = null;
    submittedBody.current = null;
    setSavedTask(null);
    setJob(null);
    setTaskError("");
    setMissingTask(false);
    setPaused(false);
  }

  function sourceSelector(kind: Kind) {
    return <div className={ui.sourceTabs} aria-label={`${kind} source`}>{(["upload", "url"] as const).map((source) => <button key={source} type="button" disabled={editingDisabled} aria-pressed={sources[kind] === source} onClick={() => setSources((previous) => ({ ...previous, [kind]: source }))}>{source === "upload" ? "Upload file" : "HTTPS URL"}</button>)}</div>;
  }

  function urlField(kind: Kind, placeholder: string) {
    return <div className={ui.urlRow}><input id={`cruise-${kind}-url`} type="url" aria-label={`${kind} direct HTTPS URL`} value={urls[kind]} onChange={(event) => changeUrl(kind, event.target.value)} placeholder={placeholder} spellCheck={false} disabled={editingDisabled} /><button type="button" disabled={editingDisabled || !urls[kind].trim()} onClick={() => preview(kind)}>Preview</button></div>;
  }

  return (
    <section className={ui.lab} id="cruise-create" aria-labelledby="cruise-lab-heading">
      <div className={ui.header}><div><p className={ui.eyebrow}>YOUR CREATIVE SPACE</p><h2 id="cruise-lab-heading">Make the deck yours.</h2></div><span className={ui.badge}><span /> EXPERIMENTAL</span></div>
      {!config && <div className={ui.configNotice} role="status">{loginRequired ? <><span>Sign in to access this generation lab.</span><Link href={loginUrl}>Sign in <ArrowUpRight size={13} aria-hidden="true" /></Link></> : configError ? <><span>{configError}</span><button type="button" onClick={() => setConfigVersion((value) => value + 1)}>Retry connection</button></> : <span><Loader2 size={13} className={ui.spin} aria-hidden="true" /> Checking generation access…</span>}</div>}
      {config && !config.capabilities.generationEnabled && <div className={ui.configNotice} role="status"><span>{config.capabilities.reason || "Generation is not available in this environment yet."}</span><button type="button" onClick={() => setConfigVersion((value) => value + 1)}>Check again</button></div>}
      <div className={ui.layout}>
        <form className={ui.form} onSubmit={generate}>
          <div className={ui.inputs}>
            <div>
              <div className={ui.fieldHeading}><label htmlFor="cruise-photo">01 / YOUR PHOTO</label><span>One person</span></div>
              {sourceSelector("photo")}
              <input ref={photoInput} id="cruise-photo" className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" disabled={editingDisabled || !config} onChange={(event) => { void upload(event.target.files?.[0], "photo"); event.target.value = ""; }} />
              {sources.photo === "upload" ? <button className={`${ui.photo} ${photoPreview ? ui.hasPhoto : ""}`} type="button" disabled={editingDisabled || !config} onClick={() => photoInput.current?.click()} aria-label={photoPreview ? "Change your photo" : "Choose your photo"}>
                {photoPreview ? <><img src={photoPreview} alt="Your selected photo for the cruise dance" /><span className={ui.replace}><Upload size={14} aria-hidden="true" /> Change photo</span></> : <><span className={ui.uploadIcon}>{uploading === "photo" ? <Loader2 size={25} className={ui.spin} aria-hidden="true" /> : <ImagePlus size={25} strokeWidth={1.4} aria-hidden="true" />}</span><strong>{uploading === "photo" ? "Uploading your photo…" : "Put yourself in the scene."}</strong><span>Choose a photo</span><small>JPG, PNG or WebP</small></>}
              </button> : <><div className={`${ui.photo} ${photoPreview ? ui.hasPhoto : ""}`}>{photoPreview ? <img src={photoPreview} alt="Your photo from the supplied URL" onError={() => setError("The photo URL could not be previewed. SeeAPI access to this URL has not been verified.")} /> : <><ImagePlus size={27} aria-hidden="true" /><strong>Preview your photo.</strong><small>Enter its direct URL below.</small></>}</div>{urlField("photo", "https://…/photo.jpg")}</>}
              <div className={ui.inputNote}>{sources.photo === "upload" && assets.photo ? <><span className={ui.filename}>{names.photo}</span><button type="button" disabled={editingDisabled} onClick={() => removeAsset("photo")} aria-label="Remove selected photo"><X size={13} /></button></> : <span>A clear, full-body photo works best.</span>}</div>
              <p className={ui.mediaSpecs}>At least 301 × 301 px · width/height ratio 0.4–2.5</p>
            </div>
            <div>
              <div className={ui.fieldHeading}><label htmlFor="cruise-video">02 / DANCE REFERENCE</label><span>Actual source clip</span></div>
              {sourceSelector("video")}
              <input ref={videoInput} id="cruise-video" className="sr-only" type="file" accept="video/mp4,video/quicktime,.mp4,.mov" disabled={editingDisabled || !config} onChange={(event) => { void upload(event.target.files?.[0], "video"); event.target.value = ""; }} />
              <div className={ui.reference}>{videoPreview ? <video key={videoPreview} src={videoPreview} controls playsInline preload="metadata" onError={() => setError("The reference video could not be played here. A browser preview does not verify that SeeAPI can read a media URL.")} /> : <div className={ui.referenceEmpty}>{uploading === "video" ? <Loader2 size={27} className={ui.spin} aria-hidden="true" /> : <Film size={27} strokeWidth={1.3} aria-hidden="true" />}<strong>{uploading === "video" ? "Checking and uploading…" : "Your motion reference."}</strong><span>{sources.video === "upload" ? "Add the cruise-deck dance clip." : "Enter a direct video URL below."}</span>{sources.video === "upload" && <button className={ui.smallButton} type="button" disabled={editingDisabled || !config} onClick={() => videoInput.current?.click()}>Choose reference clip</button>}</div>}</div>
              {sources.video === "url" ? urlField("video", "https://…/reference.mp4") : videoPreview && <div className={ui.mediaActions}><button type="button" disabled={editingDisabled} onClick={() => videoInput.current?.click()}>Change clip</button><button type="button" disabled={editingDisabled} onClick={() => removeAsset("video")}>Remove</button></div>}
              <p className={ui.inputNote}>MP4 / MOV · 2–15s</p>
              <p className={ui.mediaSpecs}>Shorter side: 480 or 720 px. Check SeeAPI’s frame-rate requirements.</p>
            </div>
          </div>
          {Object.values(assets).some((asset) => asset?.warning) && <p className={ui.mediaWarning}>{Object.values(assets).map((asset) => asset?.warning).filter(Boolean).filter((value, index, all) => all.indexOf(value) === index).join(" ")}</p>}
          {config && !config.capabilities.uploadsPublic && <p className={ui.mediaWarning}>本地上传可供预览；SeeAPI 需要可公开读取的素材。若上传资源尚未公网就绪，请切换到 HTTPS URL。</p>}
          <div className={ui.settings}>
            <fieldset disabled={editingDisabled}><legend>Duration</legend><div className={ui.segments}>{[5, 10, 15].map((value) => <button key={value} type="button" aria-pressed={duration === value} onClick={() => setDuration(value)}>{value}s</button>)}</div></fieldset>
            <fieldset disabled={editingDisabled}><legend>Resolution</legend><div className={ui.segments}>{["480p", "720p"].map((value) => <button key={value} type="button" aria-pressed={resolution === value} onClick={() => setResolution(value)}>{value}</button>)}</div></fieldset>
            <fieldset disabled={editingDisabled}><legend>Format</legend><div className={ui.segments}>{["9:16", "16:9"].map((value) => <button key={value} type="button" aria-pressed={aspectRatio === value} onClick={() => setAspectRatio(value)}>{value}</button>)}</div></fieldset>
          </div>
          <p className={ui.audioNote}><AudioLines size={16} aria-hidden="true" /><span>Audio generation is on. The original song and exact timing are not guaranteed.</span></p>
          <details className={ui.debug}>
            <summary><span><SlidersHorizontal size={14} aria-hidden="true" /> Debug settings / 调试参数</span><ChevronDown size={14} aria-hidden="true" /></summary>
            <div className={ui.debugBody}>
              <p className={ui.modelNote}>Model: {config?.template.model || "seedance-2"} · generate_audio = true</p>
              <div className={ui.promptHeading}><label htmlFor="cruise-prompt">Generation prompt</label><button type="button" disabled={editingDisabled} onClick={() => { promptEdited.current = false; setPrompt(config?.template.prompt || defaultPrompt); }}>Reset prompt</button></div>
              <textarea id="cruise-prompt" value={prompt} onChange={(event) => { promptEdited.current = true; setPrompt(event.target.value); }} rows={7} maxLength={4000} disabled={editingDisabled} />
              <p>可修改场景、人物和动作描述。参考素材必须是视频/图片直链，不能使用 TikTok 等网页链接。</p>
              <p>文件上传前会检查音视频时长及视频尺寸；浏览器无法可靠检查帧率。URL 预览不代表供应商一定能读取或素材规格已通过验证。</p>
              <div className={ui.audioHeading}><label htmlFor="cruise-audio">Optional audio reference / 声音参考</label><span>OPTIONAL</span></div>
              {sourceSelector("audio")}
              <input ref={audioInput} id="cruise-audio" className="sr-only" type="file" accept="audio/*" disabled={editingDisabled || !config} onChange={(event) => { void upload(event.target.files?.[0], "audio"); event.target.value = ""; }} />
              {sources.audio === "url" ? urlField("audio", "https://…/audio.mp3") : <div className={ui.mediaActions}><button type="button" disabled={editingDisabled || !config} onClick={() => audioInput.current?.click()}>{uploading === "audio" ? "Checking and uploading…" : assets.audio ? "Change audio" : "Choose audio file"}</button>{assets.audio && <button type="button" disabled={editingDisabled} onClick={() => removeAsset("audio")}>Remove</button>}</div>}
              {audioPreview && <audio className={ui.audioPreview} key={audioPreview} src={audioPreview} controls preload="metadata" onError={() => setError("The audio reference could not be previewed. A browser preview does not verify that SeeAPI can read a media URL.")} />}
              <p>可选：加入 2–15 秒且有权使用的声音参考。原曲不会自动包含，生成效果以模型返回为准。</p>
            </div>
          </details>
          <label className={ui.consent}><input type="checkbox" checked={consent} disabled={editingDisabled} onChange={(event) => setConsent(event.target.checked)} /><span>I have permission to use this photo and reference material, and the person shown has agreed.</span></label>
          {error && <p className={ui.error} role="alert">{error}</p>}
          {loginRequired && config && <p className={ui.error}><Link href={loginUrl}>Sign in again to continue.</Link></p>}
          <button className={ui.generate} type="submit" disabled={editingDisabled || !config?.capabilities.generationEnabled || loginRequired || !consent}><Sparkles size={17} aria-hidden="true" />{starting ? "Submitting your generation…" : active ? "A generation is awaiting its result" : job && terminal(job.status) ? "Generate again · uses SeeAPI credits" : "Generate video · uses SeeAPI credits"}<ArrowUpRight size={16} aria-hidden="true" /></button>
          <p className={ui.costNote}>This starts a real SeeAPI generation. Editing and previewing inputs do not start a task.</p>
        </form>
        <aside className={ui.output} aria-labelledby="cruise-result-heading">
          <div className={ui.outputHeading}><h3 id="cruise-result-heading">Your result</h3><span>REAL GENERATION</span></div>
          {job || savedTask ? <div className={ui.taskResult}>
            <div className={`${ui.status} ${job?.status === "succeeded" ? ui.success : ""}`} role="status">{job?.status === "succeeded" ? <Check size={16} aria-hidden="true" /> : job && !terminal(job.status) && !paused && job.status !== "submission_unknown" || starting ? <Loader2 size={16} className={ui.spin} aria-hidden="true" /> : <Film size={16} aria-hidden="true" />}<strong>{job ? statusLabels[job.status] : starting ? "Submitting to SeeAPI" : checking ? "Recovering your saved task" : "Submission needs checking"}</strong></div>
            {job?.status === "succeeded" && job.videoUrl ? <><video className={ui.resultVideo} src={job.videoUrl} controls playsInline preload="metadata" onError={() => setTaskError("The result video could not be played here. Open the original result or check the task again.")} /><div className={ui.resultActions}><a href={job.videoUrl} target="_blank" rel="noopener noreferrer"><ExternalLink size={13} aria-hidden="true" /> Open result</a><a href={videoDownloadUrl(job.videoUrl)} download="24k-magic-cruise-dance.mp4"><ArrowDownToLine size={13} aria-hidden="true" /> Download video</a></div></> : <div className={ui.taskPlaceholder}><Film size={35} strokeWidth={1.2} aria-hidden="true" /><p>{job?.status === "succeeded" ? "SeeAPI marked this task complete but has not returned a video URL." : job && terminal(job.status) ? "No playable result was returned for this task." : job?.status === "submission_unknown" || !job && !starting ? "Check or recover this task before starting another generation. A lost response does not mean the task failed." : "The task is running at the provider. This page checks its actual status every 10 seconds."}</p></div>}
            {job?.error && <p className={ui.error}>{job.error}</p>}
            {taskError && <p className={ui.error} role="alert">{taskError}</p>}
            {paused && <p className={ui.resultHint}>Automatic status checking is paused. Your existing task has not been marked failed.</p>}
            {missingTask && <div className={ui.missingTask}><p>This account has no task under the saved ID. You can clear this browser’s recovery record to prepare a new request. This action does not start a generation.</p><button type="button" disabled={checking || starting} onClick={clearMissingTask}>Clear recovery record</button></div>}
            <button className={ui.checkTask} type="button" disabled={checking || starting} onClick={() => void checkTask()}><RefreshCw size={14} className={checking ? ui.spin : undefined} aria-hidden="true" />{checking ? "Checking task…" : !job || job.status === "submission_unknown" ? "Check / recover this task" : paused ? "Resume status checking" : "Refresh task status"}</button>
            {!job && submittedBody.current && !starting && <button className={ui.retrySame} type="button" disabled={checking} onClick={() => void retrySubmission()}>Resend the same request · keep its ID</button>}
            <dl className={ui.taskDetails}><div><dt>Task</dt><dd>{job?.id || savedTask?.requestId}</dd></div>{job?.providerTaskId && <div><dt>SeeAPI task</dt><dd>{job.providerTaskId}</dd></div>}{savedTask && <div><dt>Request ID</dt><dd>{savedTask.requestId}</dd></div>}{job && <div><dt>Status</dt><dd>{job.status}</dd></div>}{typeof job?.estimatedCredits === "number" && <div><dt>Estimated provider credits</dt><dd>{job.estimatedCredits}</dd></div>}{typeof job?.consumedCredits === "number" && <div><dt>Consumed provider credits</dt><dd>{job.consumedCredits}</dd></div>}{typeof job?.refundedCredits === "number" && <div><dt>Returned provider credits</dt><dd>{job.refundedCredits}</dd></div>}</dl>
            <p className={ui.resultHint}>Only task identifiers are saved in this browser. Provider credits are separate from any future website credits.</p>
          </div> : <div className={ui.emptyResult}><div className={ui.resultIcon}><Film size={29} strokeWidth={1.3} aria-hidden="true" /></div><h4>Your next moment starts here.</h4><p>Choose your photo and review the reference. Your generated video will appear here when the task succeeds.</p><span><Check size={13} aria-hidden="true" /> No generation submitted</span></div>}
          <div className={ui.outputFooter}><span>24K MAGIC</span><span>CRUISE DECK DANCE</span></div>
        </aside>
      </div>
    </section>
  );
}
