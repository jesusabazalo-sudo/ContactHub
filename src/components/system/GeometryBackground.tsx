import { useEffect, useRef } from 'react';

type Shape = {
  x: number;
  y: number;
  size: number;
  speed: number;
  rotation: number;
  rotationSpeed: number;
  type: 'triangle' | 'square' | 'diamond';
  opacity: number;
};

export default function GeometryBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const canvasEl = canvas;
    const context = ctx;

    let animationId = 0;
    let scrollBoost = 0;
    const isMobile = window.innerWidth < 768;

    function resize() {
      canvasEl.width = window.innerWidth;
      canvasEl.height = window.innerHeight;
    }

    resize();

    const shapeTypes: Shape['type'][] = ['triangle', 'square', 'diamond'];
    const shapes: Shape[] = Array.from({ length: isMobile ? 6 : 15 }, () => ({
      x: Math.random() * canvasEl.width,
      y: Math.random() * canvasEl.height,
      size: Math.random() * (isMobile ? 18 : 30) + (isMobile ? 10 : 15),
      speed: Math.random() * (isMobile ? 0.12 : 0.3) + 0.08,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.01,
      type: shapeTypes[Math.floor(Math.random() * shapeTypes.length)],
      opacity: Math.random() * (isMobile ? 0.025 : 0.05) + (isMobile ? 0.015 : 0.02),
    }));

    function drawShape(shape: Shape) {
      context.save();
      context.translate(shape.x, shape.y);
      context.rotate(shape.rotation);
      context.globalAlpha = shape.opacity;
      context.strokeStyle = '#1DB47A';
      context.lineWidth = 1.5;

      if (shape.type === 'triangle') {
        context.beginPath();
        context.moveTo(0, -shape.size);
        context.lineTo(shape.size, shape.size);
        context.lineTo(-shape.size, shape.size);
        context.closePath();
        context.stroke();
      } else if (shape.type === 'square') {
        context.strokeRect(-shape.size / 2, -shape.size / 2, shape.size, shape.size);
      } else {
        context.beginPath();
        context.moveTo(0, -shape.size);
        context.lineTo(shape.size, 0);
        context.lineTo(0, shape.size);
        context.lineTo(-shape.size, 0);
        context.closePath();
        context.stroke();
      }

      context.restore();
    }

    function draw() {
      context.clearRect(0, 0, canvasEl.width, canvasEl.height);
      shapes.forEach((shape) => {
        drawShape(shape);
        shape.y -= shape.speed + scrollBoost;
        shape.rotation += shape.rotationSpeed;
        if (shape.y + shape.size < 0) {
          shape.y = canvasEl.height + shape.size;
          shape.x = Math.random() * canvasEl.width;
        }
      });
      scrollBoost *= 0.92;
      animationId = requestAnimationFrame(draw);
    }

    function handleScroll() {
      scrollBoost = Math.min(0.28, window.scrollY / 12000);
    }

    function handleResize() {
      resize();
    }

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll, { passive: true });
    animationId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  );
}
