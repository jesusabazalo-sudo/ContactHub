import { useEffect, useRef } from 'react';

type Crack = {
  x: number;
  y: number;
  angle: number;
  length: number;
  branches: number;
};

function createCracks(width: number, height: number) {
  const count = width < 768 ? 5 : 10;
  return Array.from({ length: count }, (_, index): Crack => ({
    x: ((index + 0.7) / count) * width,
    y: height * (0.18 + ((index * 97) % 55) / 100),
    angle: -0.9 + ((index * 37) % 120) / 100,
    length: height * (0.16 + ((index * 19) % 18) / 100),
    branches: 3 + (index % 2),
  }));
}

export default function CrackFireBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const canvas = canvasRef.current;
    if (!canvas || reduceMotion) return undefined;

    const context = canvas.getContext('2d');
    if (!context) return undefined;
    const canvasEl = canvas;
    const ctx = context;

    let animation = 0;
    let width = 0;
    let height = 0;
    let scrollProgress = 0;
    let cracks: Crack[] = [];

    function resize() {
      const ratio = window.devicePixelRatio || 1;
      width = window.innerWidth;
      height = window.innerHeight;
      canvasEl.width = width * ratio;
      canvasEl.height = height * ratio;
      canvasEl.style.width = `${width}px`;
      canvasEl.style.height = `${height}px`;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      cracks = createCracks(width, height);
    }

    function updateScroll() {
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      scrollProgress = Math.min(1, Math.max(0, window.scrollY / max));
    }

    function drawBranch(x: number, y: number, angle: number, length: number, depth: number, alpha: number) {
      if (depth <= 0) return;
      const endX = x + Math.cos(angle) * length;
      const endY = y + Math.sin(angle) * length;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(endX, endY);
      ctx.strokeStyle = `rgba(29, 180, 122, ${alpha})`;
      ctx.lineWidth = Math.max(0.6, depth * 0.45);
      ctx.shadowColor = `rgba(29, 180, 122, ${alpha * 0.7})`;
      ctx.shadowBlur = 8;
      ctx.stroke();

      const nextLength = length * 0.52;
      drawBranch(endX, endY, angle - 0.45, nextLength, depth - 1, alpha * 0.7);
      drawBranch(endX, endY, angle + 0.36, nextLength, depth - 1, alpha * 0.62);
    }

    function drawFire(time: number, intensity: number) {
      const flames = width < 768 ? 7 : 15;
      for (let index = 0; index < flames; index += 1) {
        const x = ((index + 0.4) / flames) * width;
        const flicker = Math.sin(time / 500 + index * 1.9) * 8;
        const h = 36 + intensity * 70 + flicker;
        const y = height - 18 - ((index * 23) % 26);
        const gradient = ctx.createRadialGradient(x, y, 4, x, y, h);
        gradient.addColorStop(0, `rgba(255, 134, 43, ${0.16 * intensity})`);
        gradient.addColorStop(0.42, `rgba(29, 180, 122, ${0.11 * intensity})`);
        gradient.addColorStop(1, 'rgba(29, 180, 122, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.ellipse(x, y, 22 + intensity * 16, h, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function render(time: number) {
      ctx.clearRect(0, 0, width, height);
      const mobile = width < 768;
      const maxAlpha = mobile ? 0.35 : 0.6;
      const intensity = Math.min(maxAlpha, 0.04 + scrollProgress * maxAlpha);

      for (const crack of cracks) {
        drawBranch(crack.x, crack.y, crack.angle, crack.length * (0.35 + scrollProgress), crack.branches, intensity);
      }

      drawFire(time, scrollProgress);
      animation = window.requestAnimationFrame(render);
    }

    resize();
    updateScroll();
    animation = window.requestAnimationFrame(render);

    let ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        updateScroll();
        ticking = false;
      });
    }

    window.addEventListener('resize', resize);
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      window.cancelAnimationFrame(animation);
      window.removeEventListener('resize', resize);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  return <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 z-0 h-full w-full opacity-80" aria-hidden="true" />;
}
