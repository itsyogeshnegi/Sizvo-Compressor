"use client";

import { useState, useRef, useCallback } from "react";
import { CheckCircle2, ChevronsLeftRight, Sparkles, Zap } from "lucide-react";

export function HeroComparison() {
  const [sliderPos, setSliderPos] = useState(52);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percent = Math.max(5, Math.min(95, (x / rect.width) * 100));
    setSliderPos(percent);
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging) return;
    handleMove(e.touches[0].clientX);
  }, [isDragging, handleMove]);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    handleMove(e.clientX);
  }, [isDragging, handleMove]);

  return (
    <div className="hero-comparison-wrapper">
      {/* Floating Speed Badge */}
      <div className="speed-badge-card" aria-hidden="true">
        <span className="speed-dot" />
        <Zap size={14} className="speed-icon" />
        <div className="speed-text">
          <strong>0.18s</strong>
          <small>Fast Sharp™ encode</small>
        </div>
      </div>

      {/* Floating Savings Pill */}
      <div className="savings-badge-card" aria-hidden="true">
        <span className="savings-pill">−86%</span>
        <div>
          <b>4.8 MB → 680 KB</b>
          <small>Saved 4.12 MB</small>
        </div>
      </div>

      {/* Main Interactive Comparison Stage */}
      <div
        ref={containerRef}
        className="comparison-stage"
        onMouseDown={(e) => {
          setIsDragging(true);
          handleMove(e.clientX);
        }}
        onMouseUp={() => setIsDragging(false)}
        onMouseLeave={() => setIsDragging(false)}
        onMouseMove={onMouseMove}
        onTouchStart={(e) => {
          setIsDragging(true);
          handleMove(e.touches[0].clientX);
        }}
        onTouchEnd={() => setIsDragging(false)}
        onTouchMove={onTouchMove}
      >
        {/* Compressed / Optimized Image (Background) */}
        <div className="image-layer optimized-layer">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/hero-sample-compressed.webp"
            alt="Optimized compressed sample"
            className="hero-img"
            draggable={false}
          />
          <div className="layer-tag tag-after">
            <span className="badge-dot success-dot" />
            <span>Compressed · <b>680 KB</b> (WebP)</span>
          </div>
        </div>

        {/* Original / Full Quality Image (Clipped) */}
        <div
          className="image-layer original-layer"
          style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/hero-sample.jpg"
            alt="Original uncompressed sample"
            className="hero-img"
            draggable={false}
          />
          <div className="layer-tag tag-before">
            <span className="badge-dot warning-dot" />
            <span>Original · <b>4.8 MB</b> (RAW)</span>
          </div>
        </div>

        {/* Divider Slider Line & Handle */}
        <div
          className="slider-divider"
          style={{ left: `${sliderPos}%` }}
        >
          <div className="slider-handle" aria-label="Drag to compare image quality">
            <ChevronsLeftRight size={16} />
          </div>
        </div>

        {/* Interactive Helper Hint */}
        <div className="slider-hint">
          <Sparkles size={13} />
          <span>Drag slider to inspect quality</span>
        </div>
      </div>

      {/* Bottom Quality Guarantee Card */}
      <div className="clarity-card" aria-hidden="true">
        <CheckCircle2 size={16} className="clarity-icon" />
        <span>Lossless visual clarity · 0 blur or color shift</span>
      </div>
    </div>
  );
}
