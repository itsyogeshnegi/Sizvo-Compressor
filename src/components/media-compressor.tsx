"use client";

import { useState } from "react";
import { Film, Image as ImageIcon } from "lucide-react";
import { Compressor } from "./compressor";
import { VideoCompressor } from "./video-compressor";

import type { OutputFormat, VideoCompressionMode } from "@/lib/compression/types";

export function MediaCompressor({
  initialMedia = "image",
  initialTargetKb,
  initialFormat,
  initialTargetMb,
  initialVideoMode
}: {
  initialMedia?: "image" | "video";
  initialTargetKb?: string;
  initialFormat?: OutputFormat;
  initialTargetMb?: number;
  initialVideoMode?: VideoCompressionMode;
} = {}) {
  const [media, setMedia] = useState<"image" | "video">(initialMedia);
  return (
    <div className="media-compressor">
      <div className="media-tabs" role="tablist" aria-label="Choose what to compress">
        <button role="tab" aria-selected={media === "image"} className={media === "image" ? "active" : ""} onClick={() => setMedia("image")}><ImageIcon size={18} /> Images</button>
        <button role="tab" aria-selected={media === "video"} className={media === "video" ? "active" : ""} onClick={() => setMedia("video")}><Film size={18} /> Videos <span>New</span></button>
      </div>
      {media === "image" ? (
        <Compressor defaultTargetKb={initialTargetKb} defaultFormat={initialFormat} />
      ) : (
        <VideoCompressor defaultTargetMb={initialTargetMb} defaultMode={initialVideoMode} />
      )}
    </div>
  );
}
