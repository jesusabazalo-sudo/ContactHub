import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import SectionHeading from '../ui/SectionHeading';

type FaqItem = {
  question: string;
  answer: string;
};

const faqItems: FaqItem[] = [
  {
    question: '¿Cómo funciona el acceso después de pagar?',
    answer:
      'Envías tu comprobante de pago por el chat de soporte. Un administrador lo revisa y activa tu acceso manualmente en menos de 24 horas. Recibirás una notificación cuando esté listo.',
  },
  {
    question: '¿Los contactos son reales y están verificados?',
    answer:
      'Sí. Todos los contactos en ContactHub han sido revisados y organizados manualmente antes de publicarse. No publicamos contactos sin verificar.',
  },
  {
    question: '¿Qué pasa si un contacto ya no responde?',
    answer: 'Puedes reportarlo desde el panel y lo revisamos. Mantenemos el directorio actualizado de forma continua.',
  },
  {
    question: '¿Puedo comprar más de una carpeta?',
    answer:
      'Sí. Puedes adquirir acceso a carpetas adicionales en cualquier momento desde tu panel, acumulando accesos sin perder los anteriores.',
  },
  {
    question: '¿Mis datos están seguros?',
    answer:
      'Sí. ContactHub usa Supabase con cifrado, acceso por roles y políticas de seguridad. Tu información personal nunca se comparte con terceros.',
  },
  {
    question: '¿Qué métodos de pago aceptan?',
    answer:
      'Actualmente aceptamos Yape y Plin. El proceso es manual y transparente — pagas, envías el comprobante y activamos tu acceso.',
  },
  {
    question: '¿Hay garantía de devolución?',
    answer:
      'Si el acceso no funciona correctamente por un error de nuestra parte, lo resolvemos o devolvemos el pago. Escríbenos por el chat de soporte.',
  },
];

function FaqRow({ item, isOpen, onToggle }: { item: FaqItem; isOpen: boolean; onToggle: () => void }) {
  return (
    <div className={`rounded-xl border transition-colors ${isOpen ? 'border-brand/30 bg-brand/[0.04]' : 'border-border bg-surface'}`}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className="focus-ring flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
      >
        <span className="text-sm font-semibold text-content sm:text-base">{item.question}</span>
        <ChevronDown className={`h-4 w-4 flex-none text-brand-text transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      <div className={`grid transition-[grid-template-rows] duration-300 ease-out ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
        <div className="overflow-hidden">
          <p className="px-5 pb-4 text-sm leading-6 text-content-secondary">{item.answer}</p>
        </div>
      </div>
    </div>
  );
}

export default function PricingFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="section-pad bg-surface">
      <div className="container-shell">
        <SectionHeading align="center" eyebrow="Dudas frecuentes" title="Antes de pagar, resolvemos tus dudas" />
        <div className="mx-auto mt-10 flex max-w-3xl flex-col gap-3">
          {faqItems.map((item, index) => (
            <FaqRow
              key={item.question}
              item={item}
              isOpen={openIndex === index}
              onToggle={() => setOpenIndex((current) => (current === index ? null : index))}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
