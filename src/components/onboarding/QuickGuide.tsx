import { BookOpen, Gift, HelpCircle, MessageCircle, Receipt, Search, ShieldCheck, Sparkles } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../features/auth/AuthProvider';

type QuickGuideProps = {
  mode?: 'full' | 'compact';
  forceOpen?: boolean;
};

const steps = [
  'Explora el catálogo',
  'Elige una carpeta según tu meta',
  'Usa tu prueba gratis de 3 contactos',
  'Si te sirve, desbloquea una carpeta o pack',
  'Sube tu comprobante si pagaste',
  'Revisa tus accesos en Mis contactos',
];

const guideCards = [
  {
    icon: Gift,
    title: 'Mis 3 contactos gratis',
    text: 'Elige una carpeta y prueba ContactHub con una muestra limitada.',
    cta: 'Usar prueba gratis',
    to: '/?trial=1',
  },
  {
    icon: Search,
    title: 'Explorar por metas',
    text: 'Busca contactos según lo que necesitas: aprender, vender, trabajar o crecer.',
    cta: 'Explorar catálogo',
    to: '/catalogo',
  },
  {
    icon: Receipt,
    title: 'Tengo un comprobante',
    text: 'Sube tu captura de pago para revisar y activar tu acceso.',
    cta: 'Subir comprobante',
    chatMessage: 'Hola, ya pagué y quiero subir mi comprobante para activar mi acceso.',
  },
  {
    icon: Sparkles,
    title: 'Ganar contacto extra',
    text: 'Completa misiones simples y recibe recompensas cuando sean aprobadas.',
    cta: 'Ver misiones',
    chatMessage: 'Hola, quiero ganar un contacto gratis con una misión. ¿Cómo empiezo?',
  },
  {
    icon: HelpCircle,
    title: 'Necesito ayuda',
    text: 'Abre el chat y dinos qué estás buscando. Te orientamos paso a paso.',
    cta: 'Abrir chat',
    chatMessage: 'Hola, acabo de entrar a ContactHub y necesito ayuda para empezar.',
  },
];

const infoBlocks = [
  {
    title: 'Cómo empezar',
    text: 'Mira el catálogo, identifica tu meta y abre una carpeta para ver muestras seguras.',
  },
  {
    title: 'Dónde ver mi prueba gratis',
    text: 'Toca “Ver prueba gratis”, elige una carpeta y selecciona 3 contactos reales.',
  },
  {
    title: 'Cómo desbloquear una carpeta',
    text: 'Elige una carpeta o pack, paga por Yape y espera la activación manual verificada.',
  },
  {
    title: 'Cómo subir comprobante',
    text: 'Desde el chat toca “Subir comprobante” y adjunta tu captura de pago.',
  },
  {
    title: 'Cómo ganar contactos gratis',
    text: 'Completa misiones como compartir ContactHub o invitar a alguien y manda evidencia.',
  },
  {
    title: 'Cómo pedir ayuda',
    text: 'Usa la burbuja de chat. Cuéntanos qué buscas lograr y te orientamos.',
  },
];

function openSupportChat(message: string) {
  window.dispatchEvent(new CustomEvent('contacthub:open-chat', { detail: { message } }));
}

export default function QuickGuide({ mode = 'compact', forceOpen = false }: QuickGuideProps) {
  const { user } = useAuth();
  const storageKey = useMemo(() => `contacthub:quick-guide-hidden:${user?.id ?? 'guest'}`, [user?.id]);
  const [isHidden, setIsHidden] = useState(false);

  useEffect(() => {
    if (forceOpen) {
      setIsHidden(false);
      return;
    }
    setIsHidden(window.localStorage.getItem(storageKey) === 'true');
  }, [forceOpen, storageKey]);

  if (isHidden && !forceOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsHidden(false)}
        className="focus-ring inline-flex items-center gap-2 rounded-full border border-brand-400/25 bg-brand-400/10 px-4 py-2 text-sm font-bold text-brand-100 transition hover:bg-brand-400 hover:text-ink-950"
      >
        <BookOpen className="h-4 w-4" />
        Guía rápida
      </button>
    );
  }

  return (
    <section className="rounded-3xl border border-brand-400/20 bg-panel/95 p-5 shadow-2xl shadow-black/20 sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-brand-400/25 bg-brand-400/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-brand-300">
            <ShieldCheck className="h-3.5 w-3.5" />
            Empieza por aquí
          </p>
          <h2 className="mt-4 font-display text-3xl font-bold leading-tight text-white">Bienvenido a ContactHub 👋</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-300">
            Te ayudamos a encontrar contactos y oportunidades según lo que estás buscando lograr.
          </p>
        </div>

        {!forceOpen ? (
          <button
            type="button"
            onClick={() => {
              window.localStorage.setItem(storageKey, 'true');
              setIsHidden(true);
            }}
            className="focus-ring rounded-full border border-line bg-white/5 px-4 py-2 text-xs font-bold text-gray-200 transition hover:border-brand-400/35"
          >
            Entendido, ocultar guía
          </button>
        ) : null}
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {steps.map((step, index) => (
          <div key={step} className="rounded-2xl border border-line bg-ink-950/60 p-4">
            <p className="text-xs font-bold text-brand-300">{String(index + 1).padStart(2, '0')}</p>
            <p className="mt-2 text-sm font-semibold text-white">{step}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {guideCards.map((card) => {
          const Icon = card.icon;
          const buttonClass = 'focus-ring mt-4 inline-flex w-full items-center justify-center rounded-full bg-brand-400 px-4 py-2.5 text-xs font-black text-ink-950 transition hover:bg-white';
          return (
            <article key={card.title} className="rounded-2xl border border-line bg-white/[0.03] p-4">
              <Icon className="h-5 w-5 text-brand-300" />
              <h3 className="mt-3 text-sm font-bold text-white">{card.title}</h3>
              <p className="mt-2 min-h-12 text-xs leading-5 text-gray-400">{card.text}</p>
              {card.to ? (
                <Link to={card.to} className={buttonClass}>
                  {card.cta}
                </Link>
              ) : (
                <button type="button" onClick={() => openSupportChat(card.chatMessage ?? '')} className={buttonClass}>
                  {card.cta}
                </button>
              )}
            </article>
          );
        })}
      </div>

      {mode === 'full' ? (
        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          {infoBlocks.map((block) => (
            <article key={block.title} className="rounded-2xl border border-brand-400/15 bg-brand-400/[0.06] p-5">
              <h3 className="font-display text-lg font-bold text-white">{block.title}</h3>
              <p className="mt-2 text-sm leading-6 text-gray-300">{block.text}</p>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
