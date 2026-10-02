"use client";

import { useRef } from "react";
import Image from "@/components/OptimizedImage";
import type { ImagePosition } from "@/lib/types";

interface Props {
  imageUrl: string;
  value: ImagePosition;
  onChange: (pos: ImagePosition) => void;
  aspectClassName: string; // e.g. "aspect-[21/9]" for desktop, "aspect-[3/4]" for mobile
  label: string;
}

// Lets an admin click or drag directly on the actual uploaded image to choose
// which part of it stays visible once it's cropped to fit its container —
// the same problem for hero banners (different crop shapes on mobile vs
// desktop) and category circles (a photo whose subject isn't centered).
export default function FocalPointPicker({ imageUrl, value, onChange, aspectClassName, label }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  function updateFromPointer(clientX: number, clientY: number) {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = Math.min(100, Math.max(0, ((clientX - rect.left) / rect.width) * 100));
    const y = Math.min(100, Math.max(0, ((clientY - rect.top) / rect.height) * 100));
    onChange({ x: Math.round(x), y: Math.round(y) });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-gray-400">{label}</p>
        <p className="text-[11px] text-gray-400">Click or drag on the photo to set the focal point</p>
      </div>
      <div
        ref={containerRef}
        className={`relative w-full ${aspectClassName} rounded-2xl overflow-hidden bg-bg cursor-crosshair select-none`}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          updateFromPointer(e.clientX, e.clientY);
        }}
        onPointerMove={(e) => {
          if (e.buttons === 1) updateFromPointer(e.clientX, e.clientY);
        }}
      >
        {imageUrl && (
          <Image
            src={imageUrl}
            alt=""
            fill
            className="object-cover pointer-events-none"
            style={{ objectPosition: `${value.x}% ${value.y}%` }}
            sizes="600px"
          />
        )}
        <div
          className="absolute w-5 h-5 rounded-full border-2 border-white bg-ink/70 shadow-md -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          style={{ left: `${value.x}%`, top: `${value.y}%` }}
        />
      </div>
    </div>
  );
}
