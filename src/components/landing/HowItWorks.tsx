import { CreditCard, FolderSearch, Unlock } from 'lucide-react';
import SectionHeading from '../ui/SectionHeading';

const steps = [
  {
    icon: FolderSearch,
    title: 'Entra al catálogo y elige una carpeta',
  },
  {
    icon: CreditCard,
    title: 'Paga por Yape o Plin — desde S/20',
  },
  {
    icon: Unlock,
    title: 'Accede a todos los contactos de esa carpeta',
  },
];

export default function HowItWorks() {
  return (
    <section id="como-funciona" className="section-pad section-band">
      <div className="container-shell">
        <SectionHeading eyebrow="¿Cómo funciona?" align="center" title="Tres pasos, sin complicaciones" />
        <div className="relative mt-10 grid gap-4 sm:grid-cols-3">
          <div className="absolute left-[16%] right-[16%] top-9 hidden h-px bg-gradient-to-r from-transparent via-brand-400/25 to-transparent sm:block" />
          {steps.map((step, index) => (
            <article key={step.title} className="professional-card relative flex flex-col items-center p-6 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full border border-brand-400/20 bg-brand-400/[0.08] text-brand-text">
                <step.icon className="h-6 w-6" />
              </span>
              <span className="mt-3 font-mono text-xs font-bold text-content-muted">Paso {index + 1}</span>
              <h3 className="mt-2 text-base font-bold text-content">{step.title}</h3>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
