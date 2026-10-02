"use client";

import { useEffect } from "react";

// Prevents the page behind an open drawer/modal from being scrolled. Without
// this, a translucent backdrop alone isn't enough — a user can still scroll
// the real page underneath, which can bring the page's own footer (or any
// other content) into view, bleeding through the backdrop and looking like a
// rendering bug rather than just a dimmed background.
export function useScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [locked]);
}
