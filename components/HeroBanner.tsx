"use client";

import { useEffect, useRef, useState } from "react";
import Image from "@/components/OptimizedImage";
import type { HeroBanner as HeroBannerType } from "@/lib/types";

const AUTO_ADVANCE_MS = 3000;
const SWIPE_THRESHOLD_PX = 50;

export default function HeroBanner({ banners }: { banners: HeroBannerType[] }) {
  const count = banners.length;
  const [active, setActive] = useState(0);
  const [dragOffsetPct, setDragOffsetPct] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function resetTimer() {
    if (timerRef.current) clearInterval(timerRef.current);
    if (count > 1) {
      timerRef.current = setInterval(() => {
        setActive((prev) => (prev + 1) % count);
      }, AUTO_ADVANCE_MS);
    }
  }

  useEffect(() => {
    resetTimer();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count]);

  if (count === 0) return null;

  function onTouchStart(e: React.TouchEvent) {
    if (count <= 1) return;
    touchStartX.current = e.touches[0].clientX;
    setIsDragging(true);
    if (timerRef.current) clearInterval(timerRef.current);
  }

  function onTouchMove(e: React.TouchEvent) {
    if (touchStartX.current === null || !containerRef.current) return;
    const delta = e.touches[0].clientX - touchStartX.current;
    setDragOffsetPct((delta / containerRef.current.offsetWidth) * 100);
  }

  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) {
      setIsDragging(false);
      return;
    }
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    setIsDragging(false);
    setDragOffsetPct(0);
    if (Math.abs(delta) > SWIPE_THRESHOLD_PX) {
      setActive((prev) => (prev + (delta < 0 ? 1 : -1) + count) % count);
    }
    touchStartX.current = null;
    resetTimer();
  }

  function goTo(index: number) {
    setActive(index);
    resetTimer();
  }

  const translatePct = -(active * 100) + dragOffsetPct;

  return (
    <div className="max-w-6xl mx-auto px-4">
      <div
        ref={containerRef}
        className="relative rounded-3xl overflow-hidden h-64 md:h-80 shadow-card"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onMouseEnter={() => { if (timerRef.current) clearInterval(timerRef.current); }}
        onMouseLeave={resetTimer}
      >
        <div
          className="flex h-full"
          style={{
            transform: `translateX(${translatePct}%)`,
            transition: isDragging ? "none" : "transform 500ms cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        >
          {banners.map((b, i) => {
            const mobilePos = b.mobilePosition || { x: 50, y: 50 };
            const desktopPos = b.desktopPosition || { x: 50, y: 50 };
            return (
              <a key={b.id} href={b.ctaHref} className="relative h-full w-full shrink-0">
                <Image
                  src={b.imageUrl}
                  alt={b.headline}
                  fill
                  priority={i === 0}
                  className="object-cover block md:hidden"
                  style={{ objectPosition: `${mobilePos.x}% ${mobilePos.y}%` }}
                  sizes="100vw"
                />
                <Image
                  src={b.imageUrl}
                  alt={b.headline}
                  fill
                  priority={i === 0}
                  className="object-cover hidden md:block"
                  style={{ objectPosition: `${desktopPos.x}% ${desktopPos.y}%` }}
                  sizes="100vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                <div className="absolute bottom-0 left-0 p-6 text-white max-w-xs">
                  {i === 0 ? (
                    <h1 className="text-2xl font-bold leading-tight">{b.headline}</h1>
                  ) : (
                    <h2 className="text-2xl font-bold leading-tight">{b.headline}</h2>
                  )}
                  <p className="text-sm mt-1 text-white/85">{b.subtext}</p>
                  <span className="inline-block mt-3 bg-white text-ink text-sm font-semibold px-5 py-2 rounded-full">
                    {b.ctaLabel}
                  </span>
                </div>
              </a>
            );
          })}
        </div>

        {count > 1 && (
          <div className="absolute bottom-3 right-4 z-20 flex gap-1.5">
            {banners.map((b, i) => (
              <button
                key={b.id}
                onClick={() => goTo(i)}
                aria-label={`Go to banner ${i + 1}`}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${i === active ? "bg-white" : "bg-white/40"}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
