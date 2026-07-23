import { useEffect, useMemo, useRef, useState } from 'react';

type UseVirtualListOptions = {
  itemCount: number;
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
};

/** Virtualización simple por altura fija: solo renderiza los items visibles + overscan. */
export function useVirtualList<T extends HTMLElement>({ itemCount, itemHeight, containerHeight, overscan = 4 }: UseVirtualListOptions) {
  const containerRef = useRef<T | null>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return undefined;

    function handleScroll() {
      if (frameRef.current !== null) return;
      frameRef.current = requestAnimationFrame(() => {
        frameRef.current = null;
        setScrollTop(node!.scrollTop);
      });
    }

    node.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      node.removeEventListener('scroll', handleScroll);
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
  }, []);

  return useMemo(() => {
    const totalHeight = itemCount * itemHeight;
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const visibleCount = Math.ceil(containerHeight / itemHeight) + overscan * 2;
    const endIndex = Math.min(itemCount, startIndex + visibleCount);
    const offsetY = startIndex * itemHeight;

    return { containerRef, startIndex, endIndex, totalHeight, offsetY };
  }, [containerHeight, itemCount, itemHeight, overscan, scrollTop]);
}
