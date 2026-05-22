import { MessageCircle, TimerReset } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

type PromoOffer = {
  title: string;
  normalPrice: string;
  promoPrice: string;
  savings?: string;
  gift: string;
  message: string;
};

const promoDays = [
  { day: 1, label: 'lunes' },
  { day: 3, label: 'miércoles' },
  { day: 5, label: 'viernes' },
];

const offers: PromoOffer[] = [
  {
    title: 'PROMO 1 — 1 Carpeta',
    normalPrice: 'S/20',
    promoPrice: 'S/20',
    gift: '🎁 Compra 1 y te regalo 2 carpetas más — llevas 3 por el precio de 1',
    message: 'Hola, quiero aprovechar la promo de 1 carpeta por S/20 con regalo incluido. Vi la oferta en ContactHub 🛒',
  },
  {
    title: 'PROMO 2 — Pack Starter 4 carpetas',
    normalPrice: 'S/80',
    promoPrice: 'S/65',
    savings: 'Ahorras S/15',
    gift: '🎁 Compra el Starter y te regalo 3 carpetas extra — llevas 7 en total',
    message: 'Hola, quiero el Pack Starter por S/65 con las 3 carpetas de regalo. Vi la promo en ContactHub 🛒',
  },
  {
    title: 'PROMO 3 — Pack Power 10 carpetas',
    normalPrice: 'S/200',
    promoPrice: 'S/150',
    savings: 'Ahorras S/50',
    gift: '🎁 Compra el Power y te regalo 5 carpetas extra — llevas 15 en total',
    message: 'Hola, quiero el Pack Power por S/150 con las 5 carpetas de regalo. Vi la promo en ContactHub 🛒',
  },
  {
    title: 'PROMO 4 — Acceso Total Elite 25 carpetas',
    normalPrice: 'S/500',
    promoPrice: 'S/360',
    savings: 'Ahorras S/140',
    gift: '👑 Pack total: acceso anticipado 60 días + soporte prioritario 30 días + tu nombre como Cliente VIP',
    message: 'Hola, quiero el Acceso Total Elite por S/360. Vi la promo en ContactHub 👑',
  },
];

function getPromoState(now: Date) {
  const today = now.getDay();
  const isPromoDay = [1, 3, 5].includes(today);
  const target = new Date(now);

  if (isPromoDay) {
    target.setHours(24, 0, 0, 0);
    return { isPromoDay, label: 'hoy', target };
  }

  const next = promoDays
    .map((item) => ({ ...item, distance: (item.day - today + 7) % 7 || 7 }))
    .sort((a, b) => a.distance - b.distance)[0];
  target.setDate(now.getDate() + next.distance);
  target.setHours(0, 0, 0, 0);
  return { isPromoDay, label: next.label, target };
}

function formatRemaining(target: Date) {
  const diff = Math.max(0, target.getTime() - Date.now());
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  return `${String(days).padStart(2, '0')} días ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function openChat(message: string) {
  window.dispatchEvent(new CustomEvent('contacthub:open-chat', { detail: { message } }));
}

export default function PromoOffers({ compact = false }: { compact?: boolean }) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const state = useMemo(() => getPromoState(now), [now]);
  const remaining = formatRemaining(state.target);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 rounded-2xl border border-line bg-panel p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-bold uppercase ${
              state.isPromoDay ? 'badge-pulse bg-brand-400 text-ink-950' : 'bg-white/10 text-gray-300'
            }`}
          >
            {state.isPromoDay ? '🔥 PROMO ACTIVA HOY' : `Próxima promo: ${state.label}`}
          </span>
          <p className="mt-3 text-sm leading-6 text-gray-300">Hoy los precios son estos. Mañana no prometo nada.</p>
        </div>
        <div className="rounded-xl border border-line bg-ink-950/70 px-4 py-3 text-sm text-gray-300">
          <TimerReset className="mr-2 inline h-4 w-4 text-brand-400" />
          {state.isPromoDay ? 'Termina en: ' : 'Empieza en: '}
          <span className="font-mono font-bold text-white">{remaining}</span>
        </div>
      </div>

      <div className={`grid gap-4 ${compact ? 'lg:grid-cols-4' : 'md:grid-cols-2'}`}>
        {offers.map((offer) => (
          <article
            key={offer.title}
            className={`card-hover relative overflow-hidden rounded-2xl border border-brand-400/35 bg-[#0d2a1f] p-5 ${
              state.isPromoDay ? 'shadow-[0_0_24px_rgba(29,180,122,0.18)]' : ''
            }`}
          >
            {!state.isPromoDay ? <div className="pointer-events-none absolute inset-0 bg-ink-950/35" /> : null}
            <div className="relative">
              <h3 className="min-h-12 text-base font-bold text-white">{offer.title}</h3>
              <div className="mt-4 flex items-end gap-3">
                <span className="text-sm text-gray-400 line-through">{offer.normalPrice}</span>
                <span className="font-display text-3xl font-bold text-brand-400">{offer.promoPrice}</span>
              </div>
              {offer.savings ? (
                <span className="mt-3 inline-flex rounded-full bg-amber-300 px-3 py-1 text-xs font-bold text-ink-950">{offer.savings}</span>
              ) : (
                <span className="mt-3 inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-gray-200">Sin descuento adicional</span>
              )}
              <div className="mt-4 rounded-xl border border-brand-400/25 bg-brand-400/10 p-3 text-sm leading-6 text-gray-100">{offer.gift}</div>
              <button
                type="button"
                onClick={() => openChat(offer.message)}
                className="focus-ring btn-primary-glow mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand-400 px-4 py-3 text-sm font-bold text-ink-950 transition hover:bg-white"
              >
                <MessageCircle className="h-4 w-4" />
                Quiero esta promo →
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
