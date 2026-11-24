"use client";

import { useEffect, useRef, useState } from "react";

/** Characters per second while catching up, and how fast a backlog drains. */
const MIN_RATE = 45;
const BACKLOG_DRAIN_PER_SECOND = 4;

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * Reveals `target` gradually as it grows, so bursty stream chunks read as
 * smooth typing. The speed scales with how far behind it is, so it never
 * lags the stream by much. Returns the visible text and whether it caught up.
 */
export function useRevealedText(target: string) {
  const [shown, setShown] = useState(0);
  const targetRef = useRef(target);

  useEffect(() => {
    targetRef.current = target;
  }, [target]);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    let frame = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const elapsed = Math.min(now - last, 100);
      last = now;
      setShown((current) => {
        const length = targetRef.current.length;
        const backlog = length - current;
        if (backlog <= 0) return current;
        const rate = Math.max(MIN_RATE, backlog * BACKLOG_DRAIN_PER_SECOND);
        const step = Math.max(1, Math.round((rate * elapsed) / 1000));
        return Math.min(length, current + step);
      });
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  if (prefersReducedMotion()) return { text: target, caughtUp: true };
  const visible = Math.min(shown, target.length);
  return { text: target.slice(0, visible), caughtUp: visible >= target.length };
}
