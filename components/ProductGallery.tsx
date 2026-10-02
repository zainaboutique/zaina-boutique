"use client";

import { useRef, useState } from "react";
import Image from "@/components/OptimizedImage";
import { X, ChevronLeft, ChevronRight, ZoomIn } from "lucide-react";

interface Props {
  images: string[];
  alt: string;
  activeIndex: number;
  onActiveIndexChange: (i: number) => void;
  badgesSlot?: React.ReactNode;
}

export default function ProductGallery({ images, alt, activeIndex, onActiveIndexChange, badgesSlot }: Props) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const touchStartX = useRef<number | null>(null);

  function go(delta: number) {
    onActiveIndexChange((activeIndex + delta + images.length) % images.length);
  }

  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }
  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(delta) > 40) go(delta < 0 ? 1 : -1);
    touchStartX.current = null;
  }

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    setZoomPos({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
  }

  return (
    <div>
      <div
        className="relative aspect-[4/5] w-full md:rounded-3xl overflow-hidden bg-card group cursor-zoom-in select-none"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
        onMouseMove={handleMouseMove}
        onClick={() => setLightboxOpen(true)}
        role="button"
        aria-label={`View larger image of ${alt}`}
      >
        <Image
          src={images[activeIndex]}
          alt={alt}
          fill
          className="object-contain"
          sizes="(max-width: 768px) 100vw, 480px"
          priority
        />

        {badgesSlot}

        {/* Desktop hover magnifier — the same image, scaled up, panned to follow the cursor */}
        {hovering && (
          <div
            className="hidden md:block absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: `url(${images[activeIndex]})`,
              backgroundSize: "220%",
              backgroundPosition: `${zoomPos.x}% ${zoomPos.y}%`,
              backgroundRepeat: "no-repeat",
            }}
          />
        )}

        {images.length > 1 && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); go(-1); }}
              aria-label="Previous image"
              className="hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 items-center justify-center opacity-0 group-hover:opacity-100 transition shadow-card"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); go(1); }}
              aria-label="Next image"
              className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 items-center justify-center opacity-0 group-hover:opacity-100 transition shadow-card"
            >
              <ChevronRight size={18} />
            </button>
            <div className="md:hidden absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
              {images.map((_, i) => (
                <span key={i} className={`w-1.5 h-1.5 rounded-full ${i === activeIndex ? "bg-white" : "bg-white/50"}`} />
              ))}
            </div>
          </>
        )}

        <div className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow-card">
          <ZoomIn size={14} />
        </div>
      </div>

      {images.length > 1 && (
        <div className="flex gap-2 px-4 md:px-0 mt-3 overflow-x-auto">
          {images.map((src, i) => (
            <button
              key={src + i}
              onClick={() => onActiveIndexChange(i)}
              aria-label={`View image ${i + 1} of ${alt}`}
              className={`relative w-14 h-16 rounded-xl overflow-hidden shrink-0 border-2 ${activeIndex === i ? "border-ink" : "border-transparent"}`}
            >
              <Image src={src} alt={`${alt} — photo ${i + 1}`} fill className="object-cover" sizes="56px" />
            </button>
          ))}
        </div>
      )}

      {lightboxOpen && (
        <Lightbox
          images={images}
          alt={alt}
          index={activeIndex}
          onIndexChange={onActiveIndexChange}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </div>
  );
}

function Lightbox({
  images,
  alt,
  index,
  onIndexChange,
  onClose,
}: {
  images: string[];
  alt: string;
  index: number;
  onIndexChange: (i: number) => void;
  onClose: () => void;
}) {
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const dragStart = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);
  const lastTap = useRef(0);
  const touchStartX = useRef<number | null>(null);

  function resetZoom() {
    setScale(1);
    setPan({ x: 0, y: 0 });
  }

  function go(delta: number) {
    resetZoom();
    onIndexChange((index + delta + images.length) % images.length);
  }

  function toggleZoom(clientX: number, clientY: number, rect: DOMRect) {
    if (scale > 1) {
      resetZoom();
    } else {
      setScale(2.5);
      setPan({ x: rect.width / 2 - (clientX - rect.left), y: rect.height / 2 - (clientY - rect.top) });
    }
  }

  function onTouchStart(e: React.TouchEvent) {
    if (e.touches.length !== 1) return;
    touchStartX.current = e.touches[0].clientX;
    dragStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, panX: pan.x, panY: pan.y };
  }
  function onTouchMove(e: React.TouchEvent) {
    if (scale > 1 && dragStart.current && e.touches.length === 1) {
      setPan({
        x: dragStart.current.panX + (e.touches[0].clientX - dragStart.current.x),
        y: dragStart.current.panY + (e.touches[0].clientY - dragStart.current.y),
      });
    }
  }
  function onTouchEnd(e: React.TouchEvent) {
    if (scale === 1 && touchStartX.current !== null) {
      const delta = e.changedTouches[0].clientX - touchStartX.current;
      if (Math.abs(delta) > 50) go(delta < 0 ? 1 : -1);
    }
    const now = Date.now();
    if (now - lastTap.current < 300) {
      const rect = e.currentTarget.getBoundingClientRect();
      toggleZoom(e.changedTouches[0].clientX, e.changedTouches[0].clientY, rect);
    }
    lastTap.current = now;
    touchStartX.current = null;
    dragStart.current = null;
  }

  function onMouseDown(e: React.MouseEvent) {
    if (scale > 1) dragStart.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
  }
  function onMouseMove(e: React.MouseEvent) {
    if (scale > 1 && dragStart.current) {
      setPan({ x: dragStart.current.panX + (e.clientX - dragStart.current.x), y: dragStart.current.panY + (e.clientY - dragStart.current.y) });
    }
  }
  function onMouseUp() {
    dragStart.current = null;
  }

  return (
    <div
      className="fixed inset-0 z-[100] bg-black flex items-center justify-center"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <button onClick={onClose} aria-label="Close" className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center">
        <X size={20} />
      </button>

      {images.length > 1 && (
        <>
          <button onClick={() => go(-1)} aria-label="Previous image" className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/10 text-white items-center justify-center">
            <ChevronLeft size={20} />
          </button>
          <button onClick={() => go(1)} aria-label="Next image" className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/10 text-white items-center justify-center">
            <ChevronRight size={20} />
          </button>
        </>
      )}

      <div
        className="relative w-full h-full max-w-3xl max-h-[85vh] mx-auto overflow-hidden touch-none"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onDoubleClick={(e) => toggleZoom(e.clientX, e.clientY, e.currentTarget.getBoundingClientRect())}
      >
        <div
          className="w-full h-full"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
            transition: dragStart.current ? "none" : "transform 200ms ease-out",
            cursor: scale > 1 ? "grab" : "default",
          }}
        >
          <Image src={images[index]} alt={alt} fill className="object-contain" sizes="100vw" />
        </div>
      </div>

      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
          {images.map((_, i) => (
            <span key={i} className={`w-1.5 h-1.5 rounded-full ${i === index ? "bg-white" : "bg-white/40"}`} />
          ))}
        </div>
      )}

      <p className="absolute bottom-10 left-1/2 -translate-x-1/2 text-white/50 text-xs md:hidden">
        Double-tap to zoom · Swipe for more
      </p>
    </div>
  );
}
