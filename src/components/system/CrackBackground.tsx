import { useEffect, useRef } from 'react';

type Crack = { x: number; y: number; branches: Array<Array<{ x: number; y: number }>> };

function createCracks(width: number, height: number, count: number): Crack[] {
  return Array.from({ length: count }, (_, index) => {
    const x = ((index + 1) / (count + 1)) * width;
    const y = (index % 3) * (height / 3) + height * 0.18;
    const branches = Array.from({ length: 4 }, (_, branch) => {
      const points = [{ x, y }];
      let px = x;
      let py = y;
      for (let step = 0; step < 5; step += 1) {
        px += (Math.random() - 0.45) * 90 + (branch - 1.5) * 12;
        py += 28 + Math.random() * 46;
        points.push({ x: px, y: py });
      }
      return points;
    });
    return { x, y, branches };
  });
}

export default function CrackBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const cracksRef = useRef<Crack[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const context = canvas.getContext('2d');
    if (!context) return undefined;
    const canvasElement = canvas;
    const ctx = context;

    function draw() {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const mobile = width < 768;
      canvasElement.width = width;
      canvasElement.height = height;
      if (!cracksRef.current.length) {
        cracksRef.current = createCracks(width, height, mobile ? 5 : 10);
      }
      const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const progress = Math.min(1, window.scrollY / maxScroll);
      const alpha = progress * (mobile ? 0.35 : 0.6);

      ctx.clearRect(0, 0, width, height);
      ctx.lineCap = 'round';
      ctx.shadowColor = `rgba(29,180,122,${alpha})`;
      ctx.shadowBlur = 10;

      for (const crack of cracksRef.current) {
        for (const branch of crack.branches) {
          ctx.beginPath();
          branch.forEach((point, index) => {
            if (index === 0) ctx.moveTo(point.x, point.y);
            else ctx.lineTo(point.x, point.y);
          });
          ctx.strokeStyle = `rgba(29,180,122,${alpha})`;
          ctx.lineWidth = 0.7;
          ctx.stroke();
        }
      }
    }

    function reset() {
      cracksRef.current = [];
      draw();
    }

    draw();
    window.addEventListener('scroll', draw, { passive: true });
    window.addEventListener('resize', reset);
    return () => {
      window.removeEventListener('scroll', draw);
      window.removeEventListener('resize', reset);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 z-0 h-full w-full pointer-events-none" aria-hidden="true" />;
}
