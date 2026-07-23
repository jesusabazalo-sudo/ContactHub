import { CheckCircle2, CreditCard, FolderOpen } from 'lucide-react';
import SectionHeading from '../ui/SectionHeading';

const steps = [
  {
    icon: FolderOpen,
    title: 'Elige tu carpeta',
    text: 'Explora el catálogo y selecciona la categoría que más te interesa.',
  },
  {
    icon: CreditCard,
    title: 'Paga por Yape o Plin',
    text: 'Envía el pago al número indicado y sube tu comprobante por el chat.',
  },
  {
    icon: CheckCircle2,
    title: 'Accede en menos de 24h',
    text: 'Un administrador verifica y activa tu acceso. Ya puedes ver y usar todos los contactos de tu carpeta.',
  },
];

export default function PricingSteps() {
  return (
    <div className="mt-10">
      <SectionHeading align="center" eyebrow="Proceso" title="¿Cómo funciona?" />
      <div className="relative mt-10 grid gap-6 sm:grid-cols-3">
        <div className="absolute left-[16%] right-[16%] top-7 hidden h-px bg-gradient-to-r from-transparent via-brand/25 to-transparent sm:block" />
        {steps.map((step, index) => (
          <div key={step.title} className="relative flex flex-col items-center text-center">
            <span className="relative z-10 flex h-14 w-14 items-center justify-center rounded-full border border-brand/30 bg-canvas font-display text-xl font-bold text-brand-text">
              {index + 1}
            </span>
            <step.icon className="mt-4 h-5 w-5 text-brand-text" aria-hidden="true" />
            <h3 className="mt-3 text-base font-bold text-content">{step.title}</h3>
            <p className="mt-2 max-w-xs text-sm leading-6 text-content-secondary">{step.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
