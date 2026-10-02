"use client";

import Image, { type ImageProps } from "next/image";
import { toWebp } from "@/lib/utils";

// Drop-in replacement for next/image's <Image> — same props, same behavior,
// except any string `src` that points to a real hosted image (not a data:
// URL or local /public asset) gets routed through wsrv.nl for WebP delivery.
// Swap the import (`from "next/image"` → `from "@/components/OptimizedImage"`)
// and nothing else needs to change at the call site.
export default function OptimizedImage({ src, ...rest }: ImageProps) {
  const optimizedSrc = typeof src === "string" ? toWebp(src) : src;
  return <Image src={optimizedSrc} {...rest} />;
}
