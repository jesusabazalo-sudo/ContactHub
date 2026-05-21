import { Eye, KeyRound, MessageSquareText } from 'lucide-react';
import SectionHeading from '../ui/SectionHeading';

const steps = [
  {
    icon: Eye,
    title: 'Mira qué hay',
    text: 'Explora categorías, previews y el tipo de oportunidad que existe en cada carpeta.',
  },
  {
    icon: MessageSquareText,
    title: 'Prueba 3 contactos',
    text: 'Regístrate y usa la prueba gratuita cuando quieras validar si ContactHub encaja contigo.',
  },
  {
    icon: KeyRound,
    title: 'Desbloquea lo necesario',
    text: 'Confirma tu acceso por WhatsApp y el admin activa tus carpetas desde Supabase.',
  },
];

export default function HowItWorks() {
  return (
    <section className="section-pad bg-ink-950">
      <div className="container-shell">
        <SectionHeading align="center" title="Cómo funciona sin complicarlo" />
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {steps.map((step, index) => (
            <article key={step.title} className="rounded-lg border border-line bg-panel p-6">
              <div className="flex items-center justify-between">
                <step.icon className="h-6 w-6 text-brand-400" />
                <span className="font-display text-3xl font-bold text-white/10">0{index + 1}</span>
              </div>
              <h3 className="mt-6 text-xl font-bold text-white">{step.title}</h3>
              <p className="mt-3 text-sm leading-6 text-gray-400">{step.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
