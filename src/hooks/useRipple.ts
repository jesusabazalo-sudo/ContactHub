import { useCallback, useRef } from 'react';

/** Genera un ripple expansivo desde el punto de click. Requiere `ripple-container` en el elemento. */
export function useRipple<T extends HTMLElement>() {
  const containerRef = useRef<T | null>(null);

  const onPointerDown = useCallback((event: React.MouseEvent<T>) => {
    const node = containerRef.current;
    if (!node) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

    const rect = node.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 2;
    const span = document.createElement('span');
    span.className = 'ripple-span';
    span.style.width = `${size}px`;
    span.style.height = `${size}px`;
    span.style.left = `${event.clientX - rect.left - size / 2}px`;
    span.style.top = `${event.clientY - rect.top - size / 2}px`;

    node.appendChild(span);
    span.addEventListener('animationend', () => span.remove(), { once: true });
  }, []);

  return { ref: containerRef, onPointerDown };
}
