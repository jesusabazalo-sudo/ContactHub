const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

const W = 1200, H = 630;
const canvas = createCanvas(W, H);
const ctx = canvas.getContext('2d');

// Fondo oscuro con gradiente
const bg = ctx.createLinearGradient(0, 0, W, H);
bg.addColorStop(0, '#060B0A');
bg.addColorStop(0.5, '#0A1410');
bg.addColorStop(1, '#060B0A');
ctx.fillStyle = bg;
ctx.fillRect(0, 0, W, H);

// Orbe verde nebulosa
const orb = ctx.createRadialGradient(600, 200, 0, 600, 200, 500);
orb.addColorStop(0, 'rgba(16,200,140,0.25)');
orb.addColorStop(0.5, 'rgba(16,185,129,0.08)');
orb.addColorStop(1, 'rgba(0,0,0,0)');
ctx.fillStyle = orb;
ctx.fillRect(0, 0, W, H);

// Línea decorativa superior
ctx.strokeStyle = 'rgba(16,200,140,0.4)';
ctx.lineWidth = 1;
ctx.beginPath();
ctx.moveTo(80, 80);
ctx.lineTo(1120, 80);
ctx.stroke();

// Badge superior
ctx.fillStyle = 'rgba(16,200,140,0.12)';
ctx.beginPath();
ctx.roundRect(80, 100, 340, 40, 20);
ctx.fill();
ctx.fillStyle = '#10C88C';
ctx.font = 'bold 14px Arial';
ctx.fillText('PLATAFORMA ORGANIZADA Y ACCESO VERIFICADO', 100, 125);

// Título principal
ctx.fillStyle = '#FFFFFF';
ctx.font = 'bold 72px Arial';
ctx.fillText('ContactHub', 80, 240);

// Subtítulo verde
ctx.fillStyle = '#10C88C';
ctx.font = 'bold 28px Arial';
ctx.fillText('Contactos con propósito', 80, 295);

// Descripción
ctx.fillStyle = 'rgba(255,255,255,0.65)';
ctx.font = '22px Arial';
ctx.fillText('Explora categorías, prueba gratis y desbloquea solo', 80, 360);
ctx.fillText('la información que realmente necesitas.', 80, 395);

// Stats
const stats = [
  { value: '1.400+', label: 'contactos' },
  { value: '24', label: 'categorías' },
  { value: 'S/20', label: 'desde' },
];
stats.forEach((stat, i) => {
  const x = 80 + i * 220;
  ctx.fillStyle = 'rgba(16,200,140,0.12)';
  ctx.beginPath();
  ctx.roundRect(x, 460, 180, 80, 12);
  ctx.fill();
  ctx.strokeStyle = 'rgba(16,200,140,0.25)';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = '#10C88C';
  ctx.font = 'bold 26px Arial';
  ctx.fillText(stat.value, x + 20, 505);
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.font = '15px Arial';
  ctx.fillText(stat.label, x + 20, 525);
});

// URL
ctx.fillStyle = 'rgba(255,255,255,0.35)';
ctx.font = '18px Arial';
ctx.fillText('contact-hub-knmq.vercel.app', 80, 590);

// Línea inferior
ctx.strokeStyle = 'rgba(16,200,140,0.3)';
ctx.lineWidth = 1;
ctx.beginPath();
ctx.moveTo(80, 610);
ctx.lineTo(1120, 610);
ctx.stroke();

// Guardar
const out = fs.createWriteStream(path.join(__dirname, '../public/og-image.png'));
canvas.createPNGStream().pipe(out);
out.on('finish', () => console.log('OG image generada: public/og-image.png'));
