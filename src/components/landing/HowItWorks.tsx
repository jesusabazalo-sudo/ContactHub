import { Eye, Gift, KeyRound, MessageSquareText } from 'lucide-react';
import SectionHeading from '../ui/SectionHeading';

const steps = [
  {
    icon: Eye,
    title: 'Explora gratis',
    text: 'Crea tu cuenta y mira categorías, descripciones y teléfonos protegidos sin pagar todavía.',
  },
  {
    icon: MessageSquareText,
    title: 'Dinos tu meta',
    text: 'Usa el chat para contar qué buscas lograr: aprender, vender, trabajar, conseguir proveedores o encontrar servicios.',
  },
  {
    icon: KeyRound,
    title: 'Desbloquea lo útil',
    text: 'Elige la carpeta que te acerca a tu objetivo. El acceso se activa manualmente después de validar pago o recompensa.',
  },
  {
    icon: Gift,
    title: 'Gana contactos extra',
    text: 'Si ahora no puedes pagar, completa misiones simples y envía evidencia para revisión del admin.',
  },
];

export default function HowItWorks() {
  return (
    <section className="section-pad bg-ink-950">
      <div className="container-shell">
        <SectionHeading align="center" title="Cómo avanzar dentro de ContactHub" />
        <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {steps.map((step, index) => (
            <article key={step.title} className="card-hover rounded-lg border border-line bg-panel p-6">
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
