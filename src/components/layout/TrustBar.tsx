import { CheckCircle2, Lock, Smartphone, X } from 'lucide-react';
import { useEffect, useState } from 'react';

const STORAGE_KEY = 'contacthub_trust_bar_dismissed';

const items = [
  { icon: Lock, label: 'Pagos verificados manualmente' },
  { icon: CheckCircle2, label: 'Contactos revisados y organizados' },
  { icon: Smartphone, label: 'Acceso directo por WhatsApp' },
  { icon: null, label: '🇵🇪 Plataforma hecha en Perú' },
];

export default function TrustBar() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(window.localStorage.getItem(STORAGE_KEY) !== '1');
  }, []);

  function dismiss() {
    window.localStorage.setItem(STORAGE_KEY, '1');
    setIsVisible(false);
  }

  if (!isVisible) return null;

  return (
    <div className="relative border-b border-border/60">
      <div className="container-shell flex flex-wrap items-center justify-center gap-x-6 gap-y-1.5 py-2 pr-8 text-xs text-content-muted sm:pr-10">
        {items.map((item) => (
          <span key={item.label} className="inline-flex items-center gap-1.5">
            {item.icon ? <item.icon className="h-3.5 w-3.5 text-brand-text" aria-hidden="true" /> : null}
            {item.label}
          </span>
        ))}
      </div>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Cerrar barra de confianza"
        className="focus-ring absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-content-muted transition hover:text-content"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
