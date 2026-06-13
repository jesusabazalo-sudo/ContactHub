import { Eye, Gift, KeyRound, MessageSquareText } from 'lucide-react';
import SectionHeading from '../ui/SectionHeading';

const steps = [
  {
    icon: Eye,
    title: 'Explora sin presion',
    text: 'Mira categorias, descripciones y telefonos protegidos antes de registrarte o pagar.',
  },
  {
    icon: MessageSquareText,
    title: 'Cuenta tu meta',
    text: 'Usa el chat para decir si buscas aprender, vender, trabajar, conseguir proveedores o encontrar servicios.',
  },
  {
    icon: KeyRound,
    title: 'Activa lo que necesitas',
    text: 'Elige carpeta, pack, prueba o recompensa. Los accesos se validan manualmente.',
  },
  {
    icon: Gift,
    title: 'Avanza con alternativas',
    text: 'Si ahora no puedes pagar, revisa misiones y envia evidencia para que el admin la evalue.',
  },
];

export default function HowItWorks() {
  return (
    <section className="section-pad bg-ink-950">
      <div className="container-shell">
        <SectionHeading align="center" title="Un flujo simple y transparente" />
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
