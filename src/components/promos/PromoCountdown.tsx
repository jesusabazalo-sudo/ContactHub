import { useEffect, useMemo, useState } from 'react';

const promoDays = [
  { day: 1, title: 'Lunes de acceso rápido ⚡' },
  { day: 3, title: 'Miércoles de carpetas power 🔥' },
  { day: 5, title: 'Viernes de desbloqueo premium 🚀' },
];

function getPromoState(now: Date) {
  const currentDay = now.getDay();
  const todayPromo = promoDays.find((promo) => promo.day === currentDay);

  if (todayPromo) {
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);
    return { active: true, title: todayPromo.title, target: end };
  }

  const nextPromo = promoDays
    .map((promo) => ({ ...promo, offset: (promo.day - currentDay + 7) % 7 || 7 }))
    .sort((a, b) => a.offset - b.offset)[0];
  const target = new Date(now);
  target.setDate(now.getDate() + nextPromo.offset);
  target.setHours(0, 0, 0, 0);
  return { active: false, title: nextPromo.title, target };
}

function formatRemaining(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(days).padStart(2, '0')} días ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export default function PromoCountdown() {
  const [now, setNow] = useState(() => new Date());
  const state = useMemo(() => getPromoState(now), [now]);

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <div className="rounded-2xl border border-brand-400/20 bg-ink-950/60 p-4">
      <p className="text-xs font-black uppercase tracking-wide text-brand-400">{state.active ? 'Promo activa hoy' : 'Próxima promo en:'}</p>
      <p className="mt-1 font-display text-xl font-bold text-white">{state.title}</p>
      <p className="mt-2 font-mono text-lg font-bold text-amber-200">{formatRemaining(state.target.getTime() - now.getTime())}</p>
      <p className="mt-2 text-xs leading-5 text-gray-400">
        Las promos se activan lunes, miércoles y viernes. Si hoy aparece activa, aprovéchala antes de que el contador llegue a cero.
      </p>
    </div>
  );
}
