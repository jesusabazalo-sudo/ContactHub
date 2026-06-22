import { useEffect } from 'react';

/**
 * Revela con una transición suave los elementos con clase `.reveal` dentro de
 * <main> cuando entran al viewport. Se re-ejecuta al cambiar de ruta (key).
 * Respeta prefers-reduced-motion vía CSS (.reveal queda visible sin transición).
 */
export function useScrollReveal(routeKey: string) {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const elements = Array.from(document.querySelectorAll<HTMLElement>('main .reveal'));
    if (!elements.length) return;

    if (reduce || !('IntersectionObserver' in window)) {
      elements.forEach((el) => el.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
    );

    // Revela de inmediato lo que ya está visible al cargar (evita huecos en blanco).
    elements.forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.92) el.classList.add('is-visible');
      else observer.observe(el);
    });

    return () => observer.disconnect();
  }, [routeKey]);
}
