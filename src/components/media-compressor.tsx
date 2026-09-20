"use client";

import { Compressor } from "./compressor";
import type { OutputFormat, VideoCompressionMode } from "@/lib/compression/types";

// Note: Video compressor is preserved for Phase 2
// import { useState } from "react";
// import { Film, Image as ImageIcon } from "lucide-react";
// import { VideoCompressor } from "./video-compressor";

export function MediaCompressor({
  initialTargetKb,
  initialFormat,
}: {
  initialMedia?: "image" | "video";
  initialTargetKb?: string;
  initialFormat?: OutputFormat;
  initialTargetMb?: number;
  initialVideoMode?: VideoCompressionMode;
} = {}) {
  return (
    <div className="media-compressor">
      {/*
        PHASE 2 VIDEO TABS (Preserved for future activation):
        <div className="media-tabs" role="tablist" aria-label="Choose what to compress">
          <button role="tab" aria-selected={media === "image"} className={media === "image" ? "active" : ""} onClick={() => setMedia("image")}><ImageIcon size={18} /> Images</button>
          <button role="tab" aria-selected={media === "video"} className={media === "video" ? "active" : ""} onClick={() => setMedia("video")}><Film size={18} /> Videos <span>New</span></button>
        </div>
      */}
      <Compressor defaultTargetKb={initialTargetKb} defaultFormat={initialFormat} />
    </div>
  );
}
