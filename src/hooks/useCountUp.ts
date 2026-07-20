import { useEffect, useRef, useState } from 'react';

type UseCountUpOptions = {
  end: number;
  duration?: number;
  start?: number;
};

/** Anima un número de `start` a `end` (ease-out) cuando el elemento referenciado entra en pantalla. */
export function useCountUp<T extends HTMLElement>({ end, duration = 1500, start = 0 }: UseCountUpOptions) {
  const [value, setValue] = useState(start);
  const [hasStarted, setHasStarted] = useState(false);
  const elementRef = useRef<T | null>(null);

  useEffect(() => {
    const node = elementRef.current;
    if (!node || hasStarted) return;

    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      setHasStarted(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setHasStarted(true);
            observer.disconnect();
          }
        });
      },
      { threshold: 0.3 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasStarted]);

  useEffect(() => {
    if (!hasStarted) return undefined;

    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) {
      setValue(end);
      return undefined;
    }

    let frameId: number;
    const startTime = performance.now();

    function tick(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      const eased = 1 - (1 - progress) ** 3; // ease-out cúbico
      setValue(Math.round(start + (end - start) * eased));
      if (progress < 1) frameId = requestAnimationFrame(tick);
    }

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [hasStarted, end, duration, start]);

  return { value, ref: elementRef };
}
