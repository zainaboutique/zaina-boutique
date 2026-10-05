"use client";

import Image, { type ImageLoaderProps, type ImageProps } from "next/image";

// Drop-in replacement for next/image's <Image> — same props, same behavior.
//
// Photos hosted on the web (Firebase Storage etc.) are resized and converted
// to WebP by the free wsrv.nl service, at exactly the width the browser asks
// for, and delivered straight to the visitor. Vercel's own image processing
// is never used, so it can't run into Vercel's monthly image limits.
function wsrvLoader({ src, width, quality }: ImageLoaderProps): string {
  return `https://wsrv.nl/?url=${encodeURIComponent(src)}&w=${width}&we&output=webp&q=${quality ?? 80}`;
}

export default function OptimizedImage({ src, ...rest }: ImageProps) {
  if (typeof src === "string") {
    const isHostedPhoto = /^https?:\/\//i.test(src) && !/\.svg(\?|$)/i.test(src);
    if (isHostedPhoto) {
      return <Image src={src} loader={wsrvLoader} {...rest} />;
    }
  }
  // Local files, data/blob URLs, SVGs and imported images are shown as they are.
  return <Image src={src} unoptimized {...rest} />;
}
