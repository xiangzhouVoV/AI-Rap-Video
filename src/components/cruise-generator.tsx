"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowDownToLine, ArrowUpRight, Check, ExternalLink, Film, ImagePlus, Loader2, RefreshCw, Sparkles, Upload, X } from "lucide-react";
import ui from "./cruise-generator.module.css";

const storagePrefix = "airaptovideo:24k-magic:task:v1";
const templateVersion = 4;
const loginUrl = "/login?returnTo=%2Feffects%2F24k-magic%23cruise-create";
const photoSlots = ["photo", "partnerPhoto"] as const;
type Slot = typeof photoSlots[number];
const slotLabels: Record<Slot, string> = { photo: "dancer photo", partnerPhoto: "partner photo" };
type Asset = { id: string; url: string; externalReady?: boolean };
type Config = {
  userId: string;
  template: { version: number };
  capabilities: { generationEnabled: boolean; uploadsPublic: boolean; templatePaused?: boolean; reason?: string };
};
type Job = {
  id: string;
  templateVersion?: number;
  status: "submitting" | "processing" | "succeeded" | "failed" | "canceled" | "refunded" | "expired" | "submission_unknown";
  providerTaskId?: string;
  canRetry?: boolean;
  retryUsesCredits?: boolean;
  templatePaused?: boolean;
  estimatedCredits?: number;
  consumedCredits?: number;
  refundedCredits?: number;
  videoUrl?: string;
  error?: string;
  createdAt: string;
  updatedAt: string;
};
type SavedTask = { version: 1; requestId: string; jobId?: string; retryId?: string };
type GenerationBody = {
  templateId: "24k-magic"; templateVersion: typeof templateVersion; requestId: string;
  photoId?: string; photoUrl?: string;
  partnerPhotoId?: string; partnerPhotoUrl?: string;
  resolution: string;
};

class RequestError extends Error {
  constructor(message: string, public status?: number, public code?: string) { super(message); }
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const timeout = AbortSignal.timeout(65_000);
  const response = await fetch(url, { ...init, signal: init?.signal ? AbortSignal.any([init.signal, timeout]) : timeout, cache: "no-store" });
  const data = await response.json().catch(() => { throw new RequestError("The server returned an unreadable response. Check the task before starting another generation.", response.status); });
  if (!response.ok) throw new RequestError(typeof data.error === "string" ? data.error : data.error?.message || "The request could not be completed.", response.status, data.error?.code);
  return data as T;
}

function httpsUrl(value: string, label: string) {
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "https:" || url.username || url.password || /(^|\.)(tiktok\.com|youtube\.com|youtu\.be|instagram\.com)$/i.test(url.hostname)) throw new Error();
    return url.href;
  } catch { throw new Error(`${label}: use a direct HTTPS media URL, not a social-media page link.`); }
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
    return value?.version === 1 && typeof value.requestId === "string" && validId.test(value.requestId)
      && (value.jobId === undefined || typeof value.jobId === "string" && validId.test(value.jobId))
      && (value.retryId === undefined || typeof value.retryId === "string" && validId.test(value.retryId)) ? value : null;
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
  const [sources, setSources] = useState<Record<Slot, "upload" | "url">>({ photo: "upload", partnerPhoto: "upload" });
  const [assets, setAssets] = useState<Partial<Record<Slot, Asset>>>({});
  const [urls, setUrls] = useState<Record<Slot, string>>({ photo: "", partnerPhoto: "" });
  const [previews, setPreviews] = useState<Record<Slot, string>>({ photo: "", partnerPhoto: "" });
  const [names, setNames] = useState<Partial<Record<Slot, string>>>({});
  const [uploading, setUploading] = useState<Partial<Record<Slot, boolean>>>({});
  const [resolution, setResolution] = useState("720p");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState("");
  const [job, setJob] = useState<Job | null>(null);
  const [savedTask, setSavedTask] = useState<SavedTask | null>(null);
  const [starting, setStarting] = useState(false);
  const [checking, setChecking] = useState(false);
  const [paused, setPaused] = useState(false);
  const [taskError, setTaskError] = useState("");
  const [missingTask, setMissingTask] = useState(false);
  const submittedBody = useRef<GenerationBody | null>(null);
  const savedRef = useRef<SavedTask | null>(null);
  const storageKey = useRef<string | null>(null);
  const photoInputs = useRef<Partial<Record<Slot, HTMLInputElement | null>>>({});
  const templateReady = config?.template.version === templateVersion;
  const earlierJob = job?.templateVersion != null && job.templateVersion < templateVersion;
  const previousResult = earlierJob && terminal(job.status) && !savedTask?.retryId;
  const ResultPanel = previousResult ? "details" : "div";
  const templatePaused = config?.capabilities.templatePaused === true || job?.templateVersion === templateVersion && job.templatePaused === true;
  const generationEnabled = templateReady && config?.capabilities.generationEnabled === true && !templatePaused;
  const canRetry = job?.canRetry === true && templateReady && (generationEnabled || templatePaused);
  const active = starting || !!savedTask?.retryId || !!job && !terminal(job.status) || !!savedTask && !job;
  const inputsLocked = active || templatePaused;
  const editingDisabled = inputsLocked || Object.values(uploading).some(Boolean);

  function rememberTask(task: SavedTask) {
    if (!storageKey.current) throw new Error("Sign in before starting a generation.");
    try { localStorage.setItem(storageKey.current, JSON.stringify(task)); }
    catch { throw new Error("Enable browser storage before starting so this task can be recovered safely."); }
    savedRef.current = task;
    setSavedTask(task);
  }

  function acceptJob(nextJob: Job, retryConfirmed = false) {
    setJob(nextJob);
    if (savedRef.current) {
      const next = { ...savedRef.current, jobId: nextJob.id };
      if (retryConfirmed || !nextJob.canRetry) delete next.retryId;
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

  async function upload(file: File | undefined, slot: Slot) {
    if (!file || inputsLocked || uploading[slot]) return;
    setError("");
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) { setError("Choose a JPG, PNG, or WebP photo."); return; }
    setUploading((previous) => ({ ...previous, [slot]: true }));
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("kind", "photo");
      const result = await request<{ asset: Asset; externalReady?: boolean }>("/api/template-media", { method: "POST", body });
      setAssets((previous) => ({ ...previous, [slot]: { ...result.asset, externalReady: result.externalReady ?? result.asset.externalReady } }));
      setNames((previous) => ({ ...previous, [slot]: file.name }));
      setSources((previous) => ({ ...previous, [slot]: "upload" }));
    } catch (caught) {
      if (caught instanceof RequestError && caught.status === 401) setLoginRequired(true);
      setError(`${slotLabels[slot]}: ${(caught as Error).message}`);
    } finally { setUploading((previous) => ({ ...previous, [slot]: false })); }
  }

  function preview(slot: Slot) {
    try { const url = httpsUrl(urls[slot], `${slotLabels[slot]} URL`); setPreviews((previous) => ({ ...previous, [slot]: url })); setError(""); }
    catch (caught) { setError((caught as Error).message); }
  }

  function changeUrl(slot: Slot, value: string) {
    setUrls((previous) => ({ ...previous, [slot]: value }));
    setPreviews((previous) => ({ ...previous, [slot]: "" }));
  }

  function removeAsset(slot: Slot) {
    setAssets((previous) => ({ ...previous, [slot]: undefined }));
    setNames((previous) => ({ ...previous, [slot]: undefined }));
  }

  function photoFields(slot: Slot): Record<string, string> {
    if (sources[slot] === "url") {
      return { [`${slot}Url`]: httpsUrl(urls[slot], `${slotLabels[slot]} URL`) };
    }
    const asset = assets[slot];
    if (!asset) throw new Error(`Add your ${slotLabels[slot]} before starting.`);
    if (!(asset.externalReady ?? config?.capabilities.uploadsPublic)) throw new Error(`Choose HTTPS URL for the ${slotLabels[slot]} and enter a direct image link.`);
    return { [`${slot}Id`]: asset.id };
  }

  async function generate(event: React.FormEvent) {
    event.preventDefault();
    if (checking || editingDisabled || !generationEnabled) return;
    setError("");
    const previousTask = savedRef.current;
    const previousJob = job;
    let body: GenerationBody;
    try {
      if (!consent) throw new Error("Confirm that you have permission to use both photos.");
      body = {
        templateId: "24k-magic", templateVersion, requestId: crypto.randomUUID(),
        ...photoFields("photo"), ...photoFields("partnerPhoto"), resolution,
      };
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
      const templateChanged = caught instanceof RequestError && (caught.code === "TEMPLATE_PAUSED" || caught.code === "TEMPLATE_UPDATED");
      if (caught instanceof RequestError && (templateChanged || [400, 401, 403, 404, 410, 413, 415, 422, 429].includes(caught.status || 0))) {
        setError(caught.message);
        if (caught.status === 401) setLoginRequired(true);
        setJob(previousJob);
        submittedBody.current = null;
        try {
          if (previousTask) rememberTask(previousTask);
          else {
            savedRef.current = null;
            setSavedTask(null);
            if (storageKey.current) localStorage.removeItem(storageKey.current);
          }
        } catch { setError("The browser could not update its task recovery record."); }
        if (templateChanged) setConfigVersion((value) => value + 1);
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
    if (!body || starting || checking || job || !generationEnabled) return;
    setStarting(true);
    setTaskError("");
    try {
      const result = await request<{ job: Job }>("/api/template-generations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      acceptJob(result.job);
    } catch (caught) {
      setTaskError((caught as Error).message);
      setPaused(true);
      if (caught instanceof RequestError && (caught.code === "TEMPLATE_PAUSED" || caught.code === "TEMPLATE_UPDATED")) setConfigVersion((value) => value + 1);
    }
    finally { setStarting(false); }
  }

  async function retryUnfinished() {
    const task = savedRef.current;
    if (!job || !canRetry || !task || checking || starting || loginRequired) return;
    const retryId = task.retryId ?? crypto.randomUUID();
    setStarting(true);
    setTaskError("");
    try {
      rememberTask({ ...task, retryId });
      const result = await request<{ job: Job }>(`/api/template-generations/${encodeURIComponent(job.id)}/retry`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ retryId }),
      });
      acceptJob(result.job, true);
    } catch (caught) {
      setTaskError((caught as Error).message);
      if (caught instanceof RequestError && caught.status === 401) setLoginRequired(true);
      if (caught instanceof RequestError && caught.code === "TEMPLATE_PAUSED") setConfigVersion((value) => value + 1);
    } finally { setStarting(false); }
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

  function sourceSelector(slot: Slot) {
    return <div className={ui.sourceTabs} role="group" aria-label={`${slotLabels[slot]} source`}>{(["upload", "url"] as const).map((source) => <button key={source} type="button" disabled={inputsLocked || uploading[slot]} aria-pressed={sources[slot] === source} onClick={() => setSources((previous) => ({ ...previous, [slot]: source }))}>{source === "upload" ? "Upload file" : "HTTPS URL"}</button>)}</div>;
  }

  function urlField(slot: Slot, placeholder: string) {
    return <div className={ui.urlRow}><input id={`cruise-${slot}-url`} type="url" aria-label={`${slotLabels[slot]} direct HTTPS URL`} value={urls[slot]} onChange={(event) => changeUrl(slot, event.target.value)} placeholder={placeholder} spellCheck={false} disabled={inputsLocked || uploading[slot]} /><button type="button" disabled={inputsLocked || uploading[slot] || !urls[slot].trim()} onClick={() => preview(slot)}>Preview</button></div>;
  }

  return (
    <section className={ui.lab} id="cruise-create" aria-labelledby="cruise-lab-heading">
      <div className={ui.header}><div><p className={ui.eyebrow}>YOUR CREATIVE SPACE</p><h2 id="cruise-lab-heading">Make the deck yours.</h2></div><span className={ui.badge}><span /> EXPERIMENTAL</span></div>
      {!config && <div className={ui.configNotice} role="status">{loginRequired ? <><span>Sign in to create your video.</span><Link href={loginUrl}>Sign in <ArrowUpRight size={13} aria-hidden="true" /></Link></> : configError ? <><span>{configError}</span><button type="button" onClick={() => setConfigVersion((value) => value + 1)}>Retry connection</button></> : <span><Loader2 size={13} className={ui.spin} aria-hidden="true" /> Checking generation access…</span>}</div>}
      {config && !generationEnabled && <div className={ui.configNotice} role="status"><span>{templatePaused ? config.capabilities.reason || "New videos are paused while we update this template." : templateReady ? "This template is temporarily unavailable." : "The template is being updated. Please check again shortly."}</span><button type="button" onClick={() => setConfigVersion((value) => value + 1)}>Check again</button></div>}
      <div className={ui.layout}>
        <form className={ui.form} onSubmit={generate}>
          <div className={ui.inputs}>
            {photoSlots.map((slot) => {
              const isDancer = slot === "photo";
              const label = slotLabels[slot];
              const previewUrl = sources[slot] === "upload" ? assets[slot]?.url : previews[slot];
              const locked = inputsLocked || uploading[slot];
              return (
                <div key={slot}>
                  <div className={ui.fieldHeading}><label htmlFor={`cruise-${slot}${sources[slot] === "url" ? "-url" : ""}`}>{isDancer ? "01 / DECK DANCER" : "02 / DOORWAY PARTNER"}</label><span>Required</span></div>
                  {sourceSelector(slot)}
                  {sources[slot] === "upload" ? <>
                    <input ref={(node) => { photoInputs.current[slot] = node; }} id={`cruise-${slot}`} className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" disabled={locked || !config} onChange={(event) => { void upload(event.target.files?.[0], slot); event.target.value = ""; }} />
                    <button className={`${ui.photo} ${previewUrl ? ui.hasPhoto : ""}`} type="button" disabled={locked || !config} onClick={() => photoInputs.current[slot]?.click()} aria-label={`${previewUrl ? "Change" : "Choose"} ${label}`}>
                      {previewUrl ? <><img src={previewUrl} alt={`Selected ${label}`} /><span className={ui.replace}><Upload size={14} aria-hidden="true" />{uploading[slot] ? "Uploading…" : "Change photo"}</span></> : <>
                        <span className={ui.uploadIcon}>{uploading[slot] ? <Loader2 size={25} className={ui.spin} aria-hidden="true" /> : <ImagePlus size={25} strokeWidth={1.4} aria-hidden="true" />}</span>
                        <strong>{uploading[slot] ? "Uploading…" : `Choose ${label}`}</strong><small>JPG, PNG or WebP</small>
                      </>}
                    </button>
                  </> : <>
                    <div className={`${ui.photo} ${previewUrl ? ui.hasPhoto : ""}`}>{previewUrl ? <img src={previewUrl} alt={`Selected ${label}`} onError={() => setError(`The ${label} URL could not be previewed.`)} /> : <><ImagePlus size={27} aria-hidden="true" /><strong>Preview {label}</strong><small>Enter its direct URL below.</small></>}</div>
                    {urlField(slot, isDancer ? "https://…/dancer.jpg" : "https://…/partner.jpg")}
                  </>}
                  <div className={ui.inputNote}>{sources[slot] === "upload" && assets[slot] ? <><span className={ui.filename}>{names[slot]}</span><button type="button" disabled={locked} onClick={() => removeAsset(slot)} aria-label={`Remove ${label}`}><X size={13} /></button></> : <span>Use a clear photo of one face.</span>}</div>
                  <p className={ui.mediaSpecs}>At least 301 × 301 px · width/height ratio 0.4–2.5</p>
                </div>
              );
            })}
          </div>
          {config && !config.capabilities.uploadsPublic && <p className={ui.mediaWarning}>To generate with your photos here, choose HTTPS URL and use a direct image link for each person.</p>}
          <div className={ui.settings}>
            <fieldset disabled={editingDisabled}><legend>Resolution</legend><div className={ui.segments}>{["480p", "720p"].map((value) => <button key={value} type="button" aria-pressed={resolution === value} onClick={() => setResolution(value)}>{value}</button>)}</div></fieldset>
            <div className={ui.fixedSetting}><span>Video</span><strong>About 20 seconds · 16:9</strong></div>
          </div>
          <label className={ui.consent}><input type="checkbox" checked={consent} disabled={editingDisabled} onChange={(event) => setConsent(event.target.checked)} /><span>Both people have agreed to use their photos in this video.</span></label>
          {error && <p className={ui.error} role="alert">{error}</p>}
          {loginRequired && config && <p className={ui.error}><Link href={loginUrl}>Sign in again to continue.</Link></p>}
          <button className={ui.generate} type="submit" disabled={checking || editingDisabled || !generationEnabled || loginRequired || !consent}><Sparkles size={17} aria-hidden="true" />{templatePaused ? "New videos paused" : starting ? "Submitting your generation…" : active ? "A generation is awaiting its result" : job && terminal(job.status) && !earlierJob ? "Generate again · uses SeeAPI credits" : "Generate video · uses SeeAPI credits"}<ArrowUpRight size={16} aria-hidden="true" /></button>
          {!templatePaused && <p className={ui.costNote}>This starts a real SeeAPI generation. Editing and previewing inputs do not start a task.</p>}
        </form>
        <aside className={ui.output} aria-labelledby="cruise-result-heading">
          <div className={ui.outputHeading}><h3 id="cruise-result-heading">{earlierJob && !previousResult ? "Earlier template task" : "Your result"}</h3><span>REAL GENERATION</span></div>
          {((!job && !savedTask) || previousResult) && <div className={ui.emptyResult}>
            <div className={ui.resultIcon}><Film size={29} strokeWidth={1.3} aria-hidden="true" /></div>
            {templatePaused ? <p>No generation submitted</p> : <><h4>{uploading.photo || uploading.partnerPhoto ? "Uploading your photos…" : "Your video will appear here"}</h4><p>Choose both photos and select Generate video to start.</p></>}
          </div>}
          {(job || savedTask) && <ResultPanel className={previousResult ? ui.previousResult : ui.taskResult}>
            {previousResult && <summary>Previous template task</summary>}
            <div className={`${ui.status} ${job?.status === "succeeded" ? ui.success : ""}`} role="status">{job?.status === "succeeded" ? <Check size={16} aria-hidden="true" /> : job && !terminal(job.status) && !paused && job.status !== "submission_unknown" || starting ? <Loader2 size={16} className={ui.spin} aria-hidden="true" /> : <Film size={16} aria-hidden="true" />}<strong>{job ? statusLabels[job.status] : starting ? "Submitting to SeeAPI" : checking ? "Recovering your saved task" : "Submission needs checking"}</strong></div>
            {job?.status === "succeeded" && job.videoUrl ? <><video className={ui.resultVideo} src={job.videoUrl} controls playsInline preload="metadata" onError={() => setTaskError("The result video could not be played here. Open the original result or check the task again.")} /><div className={ui.resultActions}><a href={job.videoUrl} target="_blank" rel="noopener noreferrer"><ExternalLink size={13} aria-hidden="true" /> Open result</a><a href={videoDownloadUrl(job.videoUrl)} download="24k-magic-cruise-dance.mp4"><ArrowDownToLine size={13} aria-hidden="true" /> Download video</a></div></> : <div className={ui.taskPlaceholder}><Film size={35} strokeWidth={1.2} aria-hidden="true" /><p>{job?.status === "succeeded" ? "SeeAPI marked this task complete but has not returned a video URL." : job && terminal(job.status) ? "No playable result was returned for this task." : job?.status === "submission_unknown" || !job && !starting ? "Check or recover this task before starting another generation. A lost response does not mean the task failed." : "Your video is being prepared. This page checks its status every 10 seconds."}</p></div>}
            {job?.error && <p className={ui.error}>{job.error}</p>}
            {taskError && <p className={ui.error} role="alert">{taskError}</p>}
            {paused && <p className={ui.resultHint}>Automatic status checking is paused. Your existing task has not been marked failed.</p>}
            {missingTask && <div className={ui.missingTask}><p>This account has no task under the saved ID. You can clear this browser’s recovery record to prepare a new request. This action does not start a generation.</p><button type="button" disabled={checking || starting} onClick={clearMissingTask}>Clear recovery record</button></div>}
            <button className={ui.checkTask} type="button" disabled={checking || starting} onClick={() => void checkTask()}><RefreshCw size={14} className={checking ? ui.spin : undefined} aria-hidden="true" />{checking ? "Checking task…" : !job || job.status === "submission_unknown" ? "Check / recover this task" : paused ? "Resume status checking" : "Refresh task status"}</button>
            {canRetry && <button className={ui.checkTask} type="button" disabled={checking || starting || loginRequired} onClick={() => void retryUnfinished()}>
              {job.retryUsesCredits === false ? "Finish saved video · no additional credits" : savedTask?.retryId ? "Resume retry" : "Retry unfinished generation · uses SeeAPI credits"}
            </button>}
            {!job && submittedBody.current && !starting && <button className={ui.retrySame} type="button" disabled={checking || !generationEnabled} onClick={() => void retrySubmission()}>Resend the same request · keep its ID</button>}
            <dl className={ui.taskDetails}><div><dt>Task</dt><dd>{job?.id || savedTask?.requestId}</dd></div>{job?.providerTaskId && <div><dt>SeeAPI task</dt><dd>{job.providerTaskId}</dd></div>}{savedTask && <div><dt>Request ID</dt><dd>{savedTask.requestId}</dd></div>}{job && <div><dt>Status</dt><dd>{job.status}</dd></div>}{typeof job?.estimatedCredits === "number" && <div><dt>Estimated provider credits</dt><dd>{job.estimatedCredits}</dd></div>}{typeof job?.consumedCredits === "number" && <div><dt>Consumed provider credits</dt><dd>{job.consumedCredits}</dd></div>}{typeof job?.refundedCredits === "number" && <div><dt>Returned provider credits</dt><dd>{job.refundedCredits}</dd></div>}</dl>
            <p className={ui.resultHint}>Only task identifiers are saved in this browser. Provider credits are separate from any future website credits.</p>
          </ResultPanel>}
          <div className={ui.outputFooter}><span>24K MAGIC</span><span>CRUISE DECK DANCE</span></div>
        </aside>
      </div>
    </section>
  );
}
