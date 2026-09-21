"use client";

import { useEffect, useRef, useState } from "react";
import { Archive, Check, ChevronDown, Download, ImageIcon, LoaderCircle, LockKeyhole, Maximize2, RefreshCw, Sparkles, Trash2, UploadCloud, X } from "lucide-react";
import type { CompressionSettings, JobFileRecord, OutputFormat, ResizeMode } from "@/lib/compression/types";
import { createClientZip } from "@/lib/client-zip";
import { cn, formatBytes } from "@/lib/utils";

type FileStatus = "ready" | "queued" | "uploading" | "processing" | "done" | "error" | "cancelled";
type UiFile = {
  localId: string;
  file: File;
  preview: string;
  status: FileStatus;
  progress: number;
  result?: JobFileRecord;
  outputBlob?: Blob;
  outputUrl?: string;
  error?: string;
};

const MAX_FILES = 20;
const MAX_BYTES = 50 * 1024 * 1024;
const ACCEPTED_EXTENSIONS = /\.(jpe?g|png|webp|avif)$/i;


async function readError(responseText: string) {
  try { return JSON.parse(responseText).error?.message ?? "Compression failed."; }
  catch { return "Compression failed. Please try again."; }
}

export function Compressor({
  defaultTargetKb = "",
  defaultFormat = "jpeg"
}: {
  defaultTargetKb?: string;
  defaultFormat?: OutputFormat;
} = {}) {
  const [items, setItems] = useState<UiFile[]>([]);
  const [outputFormat, setOutputFormat] = useState<OutputFormat>(defaultFormat);
  const [quality, setQuality] = useState<number>(75);
  const [targetSizeKb, setTargetSizeKb] = useState<string>(defaultTargetKb);
  const [customDimensions, setCustomDimensions] = useState(false);
  const [maxWidth, setMaxWidth] = useState<string>("");
  const [maxHeight, setMaxHeight] = useState<string>("");
  const [resizeMode, setResizeMode] = useState<ResizeMode>("fit");
  const [keepMetadata, setKeepMetadata] = useState(false);
  const [advanced, setAdvanced] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [zipping, setZipping] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const requests = useRef(new Map<string, XMLHttpRequest>());
  const itemsRef = useRef(items);

  function addFiles(incoming: File[]) {
    setGlobalError(null);
    const slots = MAX_FILES - items.length;
    if (slots <= 0) { setGlobalError(`You can compress up to ${MAX_FILES} images at once.`); return; }
    const additions: UiFile[] = [];
    for (const file of incoming.slice(0, slots)) {
      if (file.size > MAX_BYTES) { setGlobalError(`${file.name} is larger than 50 MB.`); continue; }
      if (!ACCEPTED_EXTENSIONS.test(file.name)) { setGlobalError(`${file.name} is not a supported image.`); continue; }
      additions.push({ localId: crypto.randomUUID(), file, preview: URL.createObjectURL(file), status: "ready", progress: 0 });
    }
    if (incoming.length > slots) setGlobalError(`Only the first ${slots} image${slots === 1 ? "" : "s"} were added.`);
    setItems((current) => [...current, ...additions].slice(0, MAX_FILES));
  }

  useEffect(() => { itemsRef.current = items; }, [items]);

  useEffect(() => {
    const paste = (event: ClipboardEvent) => {
      const images = Array.from(event.clipboardData?.files ?? []).filter((file) => file.type.startsWith("image/"));
      if (images.length) addFiles(images);
    };
    document.addEventListener("paste", paste);
    return () => document.removeEventListener("paste", paste);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => () => {
    for (const item of itemsRef.current) {
      URL.revokeObjectURL(item.preview);
      if (item.outputUrl) URL.revokeObjectURL(item.outputUrl);
    }
    for (const request of requests.current.values()) request.abort();
  }, []);

  function removeItem(localId: string) {
    setItems((current) => {
      const item = current.find((entry) => entry.localId === localId);
      if (item) {
        URL.revokeObjectURL(item.preview);
        if (item.outputUrl) URL.revokeObjectURL(item.outputUrl);
      }
      return current.filter((entry) => entry.localId !== localId);
    });
  }

  function settings(): CompressionSettings {
    const hasTarget = targetSizeKb.trim() !== "" && Number(targetSizeKb) > 0;
    return {
      mode: hasTarget ? "target" : "custom",
      quality,
      outputFormat,
      keepMetadata,
      resizeMode: customDimensions ? resizeMode : "fit",
      ...(hasTarget ? { targetSizeKb: Number(targetSizeKb) } : {}),
      ...(customDimensions && maxWidth ? { maxWidth: Number(maxWidth) } : {}),
      ...(customDimensions && maxHeight ? { maxHeight: Number(maxHeight) } : {})
    };
  }

  function uploadOne(item: UiFile) {
    return new Promise<void>((resolve) => {
      setItems((current) => current.map((entry) => entry.localId === item.localId ? { ...entry, status: "uploading", progress: 2, error: undefined } : entry));
      const request = new XMLHttpRequest();
      requests.current.set(item.localId, request);
      request.open("POST", "/api/images");
      request.responseType = "blob";
      request.upload.onprogress = (event) => {
        if (!event.lengthComputable) return;
        const progress = Math.max(2, Math.min(78, Math.round((event.loaded / event.total) * 78)));
        setItems((current) => current.map((entry) => entry.localId === item.localId ? { ...entry, progress } : entry));
      };
      request.upload.onload = () => {
        setItems((current) => current.map((entry) => entry.localId === item.localId ? { ...entry, status: "processing", progress: 84 } : entry));
      };
      request.onload = async () => {
        requests.current.delete(item.localId);
        if (request.status >= 200 && request.status < 300) {
          try {
            const metadata = request.getResponseHeader("X-Sizvo-Result");
            if (!metadata) throw new Error("Compression response metadata is missing.");
            const result = JSON.parse(decodeURIComponent(metadata)) as JobFileRecord;
            const outputBlob = request.response as Blob;
            const outputUrl = URL.createObjectURL(outputBlob);
            setItems((current) => current.map((entry) => {
              if (entry.localId !== item.localId) return entry;
              if (entry.outputUrl) URL.revokeObjectURL(entry.outputUrl);
              return { ...entry, status: "done", progress: 100, result, outputBlob, outputUrl };
            }));
          } catch (error) {
            setItems((current) => current.map((entry) => entry.localId === item.localId
              ? { ...entry, status: "error", error: error instanceof Error ? error.message : "Compression failed." }
              : entry));
          }
        } else {
          setItems((current) => current.map((entry) => entry.localId === item.localId ? { ...entry, status: "error", error: "Compression failed." } : entry));
          const message = await readError(await (request.response as Blob).text());
          setItems((current) => current.map((entry) => entry.localId === item.localId ? { ...entry, error: message } : entry));
        }
        resolve();
      };
      request.onerror = () => {
        requests.current.delete(item.localId);
        setItems((current) => current.map((entry) => entry.localId === item.localId ? { ...entry, status: "error", error: "Network error. Check your connection and retry." } : entry));
        resolve();
      };
      request.onabort = () => {
        requests.current.delete(item.localId);
        setItems((current) => current.map((entry) => entry.localId === item.localId ? { ...entry, status: "cancelled", progress: 0 } : entry));
        resolve();
      };
      const form = new FormData();
      form.append("file", item.file);
      form.append("settings", JSON.stringify(settings()));
      request.send(form);
    });
  }

  async function compressAll(onlyId?: string) {
    const pending = items.filter((item) => onlyId ? item.localId === onlyId : ["ready", "error", "cancelled"].includes(item.status));
    if (!pending.length || running) return;
    if (customDimensions && (!maxWidth || !maxHeight)) {
      setGlobalError("Enter both width and height for your custom image size.");
      return;
    }
    if (targetSizeKb && (Number(targetSizeKb) < 10 || Number(targetSizeKb) > 51200)) {
      setGlobalError("Target size must be between 10 KB and 51,200 KB (50 MB).");
      return;
    }
    setRunning(true);
    setGlobalError(null);
    setItems((current) => current.map((entry) => pending.some((item) => item.localId === entry.localId) ? { ...entry, status: "queued", progress: 0 } : entry));
    try {
      let cursor = 0;
      const worker = async () => {
        while (cursor < pending.length) {
          const item = pending[cursor++];
          await uploadOne(item);
        }
      };
      await Promise.all([worker(), worker()]);
    } catch (error) {
      setGlobalError(error instanceof Error ? error.message : "Could not start compression.");
      setItems((current) => current.map((entry) => entry.status === "queued" ? { ...entry, status: "error", error: "Could not start compression." } : entry));
    } finally {
      setRunning(false);
    }
  }

  async function clearAll() {
    for (const request of requests.current.values()) request.abort();
    for (const item of items) {
      URL.revokeObjectURL(item.preview);
      if (item.outputUrl) URL.revokeObjectURL(item.outputUrl);
    }
    setItems([]);
    setRunning(false);
    setGlobalError(null);
  }

  async function downloadAll() {
    const outputs = done.flatMap((item) => item.result && item.outputBlob
      ? [{ name: item.result.fileName, blob: item.outputBlob }]
      : []);
    if (outputs.length < 2 || zipping) return;

    setZipping(true);
    setGlobalError(null);
    try {
      const archive = await createClientZip(outputs);
      const url = URL.createObjectURL(archive);
      const link = document.createElement("a");
      link.href = url;
      link.download = "sizvo-images.zip";
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1_000);
    } catch (error) {
      setGlobalError(error instanceof Error ? error.message : "Could not create the ZIP archive.");
    } finally {
      setZipping(false);
    }
  }

  const done = items.filter((item) => item.status === "done");
  const actionable = items.some((item) => ["ready", "error", "cancelled"].includes(item.status));

  return (
    <section className="compressor-shell" aria-label="Image compressor">
      <div className="trust-strip"><span><LockKeyhole size={15} /> Private by design</span><span>Auto-deleted after 30 minutes</span><span>No account required</span></div>

      <div
        className={cn("drop-zone", dragging && "is-dragging", items.length > 0 && "has-files")}
        onClick={(event) => {
          if (event.target === inputRef.current) return;
          inputRef.current?.click();
        }}
        onDragEnter={(event) => { event.preventDefault(); setDragging(true); }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={(event) => { if (event.currentTarget === event.target) setDragging(false); }}
        onDrop={(event) => { event.preventDefault(); setDragging(false); addFiles(Array.from(event.dataTransfer.files)); }}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".jpg,.jpeg,.png,.webp,.avif"
          onClick={(e) => { (e.target as HTMLInputElement).value = ""; }}
          onChange={(event) => addFiles(Array.from(event.target.files ?? []))}
        />

        {/* Cloud icon only when empty */}
        {items.length === 0 && (
          <div className="upload-icon"><UploadCloud size={29} /></div>
        )}

        <div className="upload-content">
          <h2>
            {dragging
              ? "Drop them here"
              : items.length
              ? "Add more images"
              : defaultTargetKb
              ? `Drop images to compress to ${defaultTargetKb} KB`
              : "Drop images here to start compressing"}
          </h2>
          <button type="button" className="button button-primary select-image-btn" onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}>
            Select Image
          </button>
          <p className="upload-caption">
            {defaultTargetKb
              ? `Drag & drop or click Select Image to shrink to ≤ ${defaultTargetKb} KB`
              : "Drag & drop or click Select Image to upload"}
          </p>

          {/* Screenshot-matching responsive preview grid */}
          {items.length > 0 && (
            <div className="uploaded-preview-zone" onClick={(e) => e.stopPropagation()}>
              <div className="preview-zone-header">
                <span className="preview-count-badge">
                  <ImageIcon size={13} /> {items.length} image{items.length === 1 ? "" : "s"} selected · {formatBytes(items.reduce((acc, it) => acc + it.file.size, 0))}
                </span>
                <button type="button" className="preview-clear-btn" onClick={clearAll} title="Clear all images">
                  <Trash2 size={13} /> Clear all
                </button>
              </div>

              <div className={cn(
                "uploaded-preview-grid",
                items.length === 1 && "single-item",
                items.length === 2 && "two-items",
                items.length === 3 && "three-items"
              )}>
                {items.map((item) => {
                  const busy = ["queued", "uploading", "processing"].includes(item.status);
                  return (
                    <div key={item.localId} className={cn("uploaded-preview-item", item.status === "done" && "is-done")}>
                      <div className="thumb-container">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={item.preview} alt="" className="thumb-preview" />
                        {item.status !== "processing" && item.status !== "uploading" && (
                          <button
                            type="button"
                            className="thumb-x-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeItem(item.localId);
                            }}
                            title="Remove image"
                            aria-label={`Remove ${item.file.name}`}
                          >
                            <X size={12} />
                          </button>
                        )}
                      </div>
                      <div className="file-info-preview">
                        <span className="file-category-badge">Original Image</span>
                        <strong className="file-name-truncate" title={item.file.name}>{item.file.name}</strong>
                        <div className="file-meta-row">
                          <span className="file-size-text">{formatBytes(item.file.size)}</span>
                          {item.status === "done" && item.result && (
                            <span className="file-saved-badge">
                              <Check size={11} /> {item.result.savedPercent > 0 ? `${item.result.savedPercent}% smaller` : "Optimized"}
                            </span>
                          )}
                        </div>

                        {/* Live progress if busy */}
                        {busy && (
                          <div className="preview-progress-wrap">
                            <div className="preview-progress-track">
                              <span style={{ width: `${item.progress}%` }} />
                            </div>
                            <small>{item.status === "processing" ? "Optimizing…" : item.status === "queued" ? "Waiting…" : `${item.progress}%`}</small>
                          </div>
                        )}

                        {/* Download link if done */}
                        {item.status === "done" && item.result && item.outputUrl && (
                          <div className="preview-result-actions">
                            <span className="preview-new-size">{formatBytes(item.result.size)}</span>
                            <a
                              className="preview-download-btn"
                              href={item.outputUrl}
                              download
                              title={`Download ${item.result.fileName}`}
                              aria-label={`Download ${item.result.fileName}`}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Download size={12} /> Download
                            </a>
                          </div>
                        )}

                        {/* Error row */}
                        {(item.status === "error" || item.status === "cancelled") && (
                          <div className="preview-error-row">
                            <span className="preview-error-text">{item.error ?? "Cancelled"}</span>
                            <button
                              type="button"
                              className="preview-retry-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                compressAll(item.localId);
                              }}
                              title="Retry"
                            >
                              <RefreshCw size={11} /> Retry
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        <span className="upload-limits">JPEG, PNG, WebP, AVIF · Max 50 MB each</span>
      </div>

      {globalError && <div className="alert" role="alert"><X size={17} />{globalError}<button onClick={() => setGlobalError(null)} aria-label="Dismiss"><X size={15} /></button></div>}

      {items.length > 0 && (
        <div className="workspace">
          <div className="settings-panel">
            <div className="section-heading">
              <div>
                <span className="eyebrow">Settings</span>
                <h3>Output & Quality</h3>
              </div>
              <span className="recommended-pill"><Sparkles size={13} /> Real-time control</span>
            </div>

            {/* Output Format Dropdown */}
            <div className="control-group">
              <label htmlFor="output-format-select" className="control-label">
                <span>Output</span>
              </label>
              <select
                id="output-format-select"
                className="select-input"
                value={outputFormat}
                onChange={(event) => setOutputFormat(event.target.value as OutputFormat)}
              >
                <option value="jpeg">JPEG (recommended)</option>
                <option value="original">Keep original format</option>
                <option value="webp">WebP (modern & lightweight)</option>
                <option value="png">PNG (lossless graphics)</option>
                <option value="avif">AVIF (ultra-compressed)</option>
              </select>
            </div>

            {/* Quality Slider with Live Percentage */}
            <div className="control-group">
              <label htmlFor="quality-range-input" className="control-label">Quality</label>
              <div className="slider-row">
                <input
                  id="quality-range-input"
                  type="range"
                  min="1"
                  max="100"
                  value={quality}
                  onChange={(event) => setQuality(Number(event.target.value))}
                  className="quality-slider"
                />
                <span className="slider-percent-text">{quality}%</span>
              </div>
              <div className="preset-row">
                <button type="button" className={cn("preset-btn", quality === 50 && "active")} onClick={() => setQuality(50)}>Smallest (50%)</button>
                <button type="button" className={cn("preset-btn", quality === 62 && "active")} onClick={() => setQuality(62)}>62%</button>
                <button type="button" className={cn("preset-btn", quality === 75 && "active")} onClick={() => setQuality(75)}>Balanced (75%)</button>
                <button type="button" className={cn("preset-btn", quality === 90 && "active")} onClick={() => setQuality(90)}>Best (90%)</button>
              </div>
            </div>

            {/* Target Size with Inline Compress Button */}
            <div className="control-group">
              <label htmlFor="target-kb-input" className="control-label">
                <span>Target</span>
                <small className="control-sublabel">(optional exact size)</small>
              </label>
              <div className="target-input-group">
                <div className="target-box">
                  <input
                    id="target-kb-input"
                    type="number"
                    min="10"
                    max="51200"
                    placeholder="e.g. 100"
                    value={targetSizeKb}
                    onChange={(event) => setTargetSizeKb(event.target.value)}
                  />
                  <span className="unit-tag">KB</span>
                </div>
                <button
                  type="button"
                  className="button button-primary direct-compress-btn"
                  onClick={() => compressAll()}
                  disabled={!actionable || running}
                >
                  {running ? <><LoaderCircle className="spin" size={16} /> Compressing…</> : "Compress"}
                </button>
              </div>
              <small className="control-hint">
                {targetSizeKb
                  ? `Targeting exact size ≤ ${targetSizeKb} KB with quality ≤ ${quality}%.`
                  : `Currently using ${quality}% quality. Enter a target KB above if you want to aim for an exact file size.`}
              </small>
            </div>

            {/* Dimensions Panel */}
            <div className="dimensions-panel">
              <div className="dimensions-heading">
                <span className="dimensions-icon"><Maximize2 size={18} /></span>
                <div><strong>Image dimensions</strong><small>Keep original size or customize width and height.</small></div>
                <div className="dimension-toggle" aria-label="Image dimension setting">
                  <button className={!customDimensions ? "active" : ""} onClick={() => setCustomDimensions(false)} aria-pressed={!customDimensions}>Original</button>
                  <button className={customDimensions ? "active" : ""} onClick={() => setCustomDimensions(true)} aria-pressed={customDimensions}>Custom size</button>
                </div>
              </div>
              {customDimensions && <div className="dimension-fields">
                <label><span>Width</span><div><input type="number" min="64" max="16384" placeholder="e.g. 1920" value={maxWidth} onChange={(event) => setMaxWidth(event.target.value)} /><b>px</b></div></label>
                <span className="dimension-times">×</span>
                <label><span>Height</span><div><input type="number" min="64" max="16384" placeholder="e.g. 1080" value={maxHeight} onChange={(event) => setMaxHeight(event.target.value)} /><b>px</b></div></label>
                <label className="resize-select"><span>Resize behavior</span><select value={resizeMode} onChange={(event) => setResizeMode(event.target.value as ResizeMode)}><option value="fit">Fit inside · keep ratio</option><option value="exact">Exact size · center crop</option></select></label>
              </div>}
            </div>

            <button className="advanced-trigger" onClick={() => setAdvanced(!advanced)} aria-expanded={advanced}>
              Advanced settings <ChevronDown size={17} className={advanced ? "rotated" : ""} />
            </button>
            {advanced && (
              <div className="advanced-grid">
                <label className="check-field">
                  <input type="checkbox" checked={keepMetadata} onChange={(event) => setKeepMetadata(event.target.checked)} />
                  <span><strong>Keep metadata</strong><small>Retain camera EXIF and location data</small></span>
                </label>
              </div>
            )}
          </div>

          {/* Action Bar / Summary */}
          <div className="action-bar-card">
            <div className="action-summary-text">
              {done.length > 0 ? (
                <>
                  <strong>{done.length} of {items.length} images complete</strong>
                  <span>{formatBytes(done.reduce((sum, item) => sum + (item.result?.savedBytes ?? 0), 0))} saved in total</span>
                </>
              ) : (
                <>
                  <strong>Ready to compress</strong>
                  <span>{items.length} image{items.length === 1 ? "" : "s"} queued · adjust settings above or click compress</span>
                </>
              )}
            </div>
            <div className="action-buttons">
              {done.length > 1 && (
                <button type="button" className="button button-secondary zip-download-btn" onClick={downloadAll} disabled={zipping}>
                  {zipping ? <><LoaderCircle className="spin" size={17} /> Creating ZIP…</> : <><Archive size={17} /> Download All (ZIP)</>}
                </button>
              )}
              <button
                type="button"
                className="button button-primary compress-action-btn"
                onClick={() => compressAll()}
                disabled={!actionable || running}
              >
                {running ? <><LoaderCircle className="spin" size={18} /> Compressing…</> : <><Sparkles size={18} /> Compress All ({items.length})</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

