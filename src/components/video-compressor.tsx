"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Download, Film, LockKeyhole, Maximize2, Music2, Sparkles, Trash2, X } from "lucide-react";
import type { JobFileRecord, ResizeMode, VideoCompressionMode, VideoCompressionSettings } from "@/lib/compression/types";
import { cn, formatBytes } from "@/lib/utils";

type Status = "ready" | "uploading" | "processing" | "done" | "error";
const MAX_VIDEO_BYTES = 500 * 1024 * 1024;
const videoModes: Array<{ id: VideoCompressionMode; title: string; detail: string }> = [
  { id: "quality", title: "Best quality", detail: "Crisp video" },
  { id: "balanced", title: "Balanced", detail: "Recommended" },
  { id: "smallest", title: "Smallest", detail: "Maximum savings" },
  { id: "target", title: "Target size", detail: "Enter exact MB" }
];

function responseError(text: string) {
  try { return JSON.parse(text).error?.message ?? "Video compression failed."; }
  catch { return "Video compression failed. Please try again."; }
}

export function VideoCompressor({
  defaultMode,
  defaultTargetMb
}: {
  defaultMode?: VideoCompressionMode;
  defaultTargetMb?: number;
} = {}) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("ready");
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<JobFileRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [mode, setMode] = useState<VideoCompressionMode>(defaultTargetMb ? "target" : (defaultMode ?? "balanced"));
  const [targetSizeMb, setTargetSizeMb] = useState(defaultTargetMb ?? 25);
  const [customDimensions, setCustomDimensions] = useState(false);
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [resizeMode, setResizeMode] = useState<ResizeMode>("fit");
  const [removeAudio, setRemoveAudio] = useState(false);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const requestRef = useRef<XMLHttpRequest | null>(null);

  useEffect(() => () => {
    requestRef.current?.abort();
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  function selectVideo(next: File) {
    setError(null);
    if (!/\.(mp4|mov|webm)$/i.test(next.name)) { setError("Choose an MP4, MOV, or WebM video."); return; }
    if (next.size > MAX_VIDEO_BYTES) { setError("Videos must be 500 MB or smaller."); return; }
    if (preview) URL.revokeObjectURL(preview);
    setFile(next);
    setPreview(URL.createObjectURL(next));
    setStatus("ready");
    setProgress(0);
    setResult(null);
  }

  async function createJob() {
    if (jobId) return jobId;
    const response = await fetch("/api/jobs", { method: "POST" });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error?.message ?? "Could not start a video job.");
    setJobId(payload.job.id);
    return payload.job.id as string;
  }

  function clear() {
    requestRef.current?.abort();
    if (preview) URL.revokeObjectURL(preview);
    if (jobId) void fetch(`/api/jobs/${jobId}`, { method: "DELETE", keepalive: true });
    setFile(null); setPreview(null); setResult(null); setJobId(null); setError(null); setProgress(0); setStatus("ready");
  }

  async function compress() {
    if (!file || status === "uploading" || status === "processing") return;
    if (customDimensions && (!width || !height)) { setError("Enter both width and height for your custom video size."); return; }
    setError(null);
    try {
      const activeJob = await createJob();
      const settings: VideoCompressionSettings = {
        mode,
        targetSizeMb: mode === "target" ? targetSizeMb : undefined,
        resizeMode: customDimensions ? resizeMode : "fit",
        maxWidth: customDimensions ? Number(width) : undefined,
        maxHeight: customDimensions ? Number(height) : undefined,
        removeAudio
      };
      const request = new XMLHttpRequest();
      requestRef.current = request;
      request.open("POST", `/api/jobs/${activeJob}/videos`);
      request.setRequestHeader("Content-Type", file.type || "application/octet-stream");
      request.setRequestHeader("X-File-Name", encodeURIComponent(file.name));
      request.setRequestHeader("X-Compression-Settings", JSON.stringify(settings));
      request.upload.onprogress = (event) => {
        if (event.lengthComputable) setProgress(Math.min(75, Math.round(event.loaded / event.total * 75)));
      };
      request.upload.onload = () => { setStatus("processing"); setProgress(82); };
      request.onload = () => {
        requestRef.current = null;
        if (request.status >= 200 && request.status < 300) {
          setResult(JSON.parse(request.responseText).file as JobFileRecord);
          setStatus("done"); setProgress(100);
        } else { setError(responseError(request.responseText)); setStatus("error"); }
      };
      request.onerror = () => { requestRef.current = null; setError("Network error. Check your connection and retry."); setStatus("error"); };
      request.onabort = () => { requestRef.current = null; setError("Video compression was cancelled."); setStatus("error"); };
      setStatus("uploading"); setProgress(2);
      request.send(file);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not start video compression.");
      setStatus("error");
    }
  }

  return (
    <section className="compressor-shell video-shell" aria-label="Video compressor">
      <div className="trust-strip"><span><LockKeyhole size={15} /> Private by design</span><span>Auto-deleted after 30 minutes</span><span>MP4 output for easy sharing</span></div>
      {!file ? <div
        className={cn("drop-zone video-drop", dragging && "is-dragging")}
        onClick={(event) => {
          if (event.target === inputRef.current) return;
          inputRef.current?.click();
        }}
        onDragEnter={(event) => { event.preventDefault(); setDragging(true); }} onDragOver={(event) => event.preventDefault()}
        onDragLeave={(event) => { if (event.currentTarget === event.target) setDragging(false); }}
        onDrop={(event) => { event.preventDefault(); setDragging(false); const next = event.dataTransfer.files[0]; if (next) selectVideo(next); }}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".mp4,.mov,.webm,video/mp4,video/quicktime,video/webm"
          onClick={(e) => { (e.target as HTMLInputElement).value = ""; }}
          onChange={(event) => { const next = event.target.files?.[0]; if (next) selectVideo(next); }}
        />
        <div className="upload-icon"><Film size={29} /></div>
        <div>
          <h2>{defaultTargetMb ? `Drop your video to compress to ${defaultTargetMb} MB` : "Drop your video here"}</h2>
          <p>or <button type="button" onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}>browse files</button></p>
        </div>
        <span className="upload-limits">MP4, MOV, WebM · Max 500 MB · Up to 30 minutes</span>
      </div> : <div className="video-workspace">
        <div className="video-preview-card">
          {preview && <video src={preview} controls preload="metadata" />}
          <div><span className="eyebrow">Selected video</span><strong>{file.name}</strong><small>{formatBytes(file.size)}</small></div>
          <button className="icon-button" onClick={clear} aria-label="Remove video"><Trash2 size={17} /></button>
        </div>
        <div className="settings-panel">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Video settings</span>
              <h3>Choose your result</h3>
            </div>
            <span className="recommended-pill"><Sparkles size={13} /> MP4 output</span>
          </div>

          {/* Mode Selection Grid */}
          <div className="mode-grid">
            {videoModes.map((option) => (
              <button
                key={option.id}
                type="button"
                className={cn("mode-card", mode === option.id && "selected")}
                onClick={() => setMode(option.id)}
                aria-pressed={mode === option.id}
              >
                <span className="radio-dot">{mode === option.id && <Check size={12} />}</span>
                <strong>{option.title}</strong>
                <small>{option.detail}</small>
              </button>
            ))}
          </div>

          {/* Dedicated MB Reduce Option */}
          <div className="control-group video-target-group">
            <div className="control-header">
              <label htmlFor="video-target-input" className="control-label">
                <span>Reduce to Target MB</span>
                <small className="control-sublabel">(set exact file size in MB)</small>
              </label>
              {mode === "target" && (
                <span className="quality-value-badge">{targetSizeMb} MB target</span>
              )}
            </div>
            <div className="target-input-group">
              <div className="target-box">
                <input
                  id="video-target-input"
                  type="number"
                  min="0.1"
                  max={file ? Math.max(1, Math.ceil(file.size / (1024 * 1024))) : 500}
                  step="0.5"
                  placeholder="e.g. 5"
                  value={targetSizeMb}
                  onChange={(event) => {
                    const val = Number(event.target.value);
                    setTargetSizeMb(val > 0 ? val : 1);
                    setMode("target");
                  }}
                />
                <span className="unit-tag">MB</span>
              </div>
              <button
                type="button"
                className="button button-primary direct-compress-btn"
                onClick={compress}
                disabled={status === "uploading" || status === "processing"}
              >
                {status === "uploading" || status === "processing" ? "Compressing…" : "Compress"}
              </button>
            </div>
            <div className="preset-row">
              {file && file.size > 2 * 1024 * 1024 && (
                <button
                  type="button"
                  className={cn("preset-btn", mode === "target" && targetSizeMb === Math.max(1, Math.round((file.size / (1024 * 1024)) * 0.5)) && "active")}
                  onClick={() => {
                    setTargetSizeMb(Math.max(1, Math.round((file.size / (1024 * 1024)) * 0.5)));
                    setMode("target");
                  }}
                >
                  50% smaller ({Math.max(1, Math.round((file.size / (1024 * 1024)) * 0.5))} MB)
                </button>
              )}
              <button
                type="button"
                className={cn("preset-btn", mode === "target" && targetSizeMb === 8 && "active")}
                onClick={() => { setTargetSizeMb(8); setMode("target"); }}
              >
                8 MB (Discord)
              </button>
              <button
                type="button"
                className={cn("preset-btn", mode === "target" && targetSizeMb === 16 && "active")}
                onClick={() => { setTargetSizeMb(16); setMode("target"); }}
              >
                16 MB (WhatsApp)
              </button>
              <button
                type="button"
                className={cn("preset-btn", mode === "target" && targetSizeMb === 25 && "active")}
                onClick={() => { setTargetSizeMb(25); setMode("target"); }}
              >
                25 MB (Email)
              </button>
            </div>
            <small className="control-hint">
              {mode === "target"
                ? `Two-pass FFmpeg compression will calculate video bitrate to aim for ≤ ${targetSizeMb} MB.`
                : "Choose a preset mode above, or enter your target MB to compress to an exact file size."}
            </small>
          </div>

          <div className="dimensions-panel">
            <div className="dimensions-heading"><span className="dimensions-icon"><Maximize2 size={18} /></span><div><strong>Video dimensions</strong><small>Keep the source resolution or set a custom frame size.</small></div><div className="dimension-toggle"><button className={!customDimensions ? "active" : ""} onClick={() => setCustomDimensions(false)}>Original</button><button className={customDimensions ? "active" : ""} onClick={() => setCustomDimensions(true)}>Custom size</button></div></div>
            {customDimensions && <div className="dimension-fields"><label><span>Width</span><div><input type="number" min="64" max="7680" placeholder="1920" value={width} onChange={(event) => setWidth(event.target.value)} /><b>px</b></div></label><span className="dimension-times">×</span><label><span>Height</span><div><input type="number" min="64" max="4320" placeholder="1080" value={height} onChange={(event) => setHeight(event.target.value)} /><b>px</b></div></label><label className="resize-select"><span>Resize behavior</span><select value={resizeMode} onChange={(event) => setResizeMode(event.target.value as ResizeMode)}><option value="fit">Fit inside · keep ratio</option><option value="exact">Exact size · center crop</option></select></label></div>}
          </div>
          <label className="audio-toggle"><span className="dimensions-icon"><Music2 size={17} /></span><span><strong>Remove audio</strong><small>Make the video smaller and silent</small></span><input type="checkbox" checked={removeAudio} onChange={(event) => setRemoveAudio(event.target.checked)} /></label>
        </div>
        {(status === "uploading" || status === "processing") && <div className="video-progress"><div><span>{status === "uploading" ? "Uploading video…" : "Compressing video…"}</span><b>{status === "uploading" ? `${progress}%` : "This can take a few minutes"}</b></div><div className="progress-track"><span style={{ width: `${progress}%` }} /></div><button className="text-button danger" onClick={() => requestRef.current?.abort()}><X size={15} /> Cancel</button></div>}
        {error && <div className="alert" role="alert"><X size={17} />{error}</div>}
        {result && <div className="video-result"><div className="result-check"><Check size={20} /></div><div><strong>Your video is ready</strong><span>{formatBytes(file.size)} → {formatBytes(result.size)} · {result.savedPercent}% smaller · {result.width}×{result.height}</span>{result.warnings.map((warning) => <small key={warning}>{warning}</small>)}</div>{jobId && <a className="button button-primary" href={`/api/jobs/${jobId}/files/${result.id}`}><Download size={17} /> Download MP4</a>}</div>}
        {!result && status !== "uploading" && status !== "processing" && <div className="video-action"><div><strong>Ready to compress</strong><span>Processing happens securely on your server.</span></div><button className="button button-primary" onClick={compress}><Sparkles size={18} /> Compress video</button></div>}
      </div>}
      {!file && error && <div className="alert" role="alert"><X size={17} />{error}</div>}
    </section>
  );
}
