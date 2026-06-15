import { Eye, FolderSearch, KeyRound, UserRoundCheck } from 'lucide-react';
import SectionHeading from '../ui/SectionHeading';

const steps = [
  {
    icon: Eye,
    title: 'Explora las categorías',
    text: 'Revisa nombres, descripciones, ejemplos y teléfonos protegidos sin necesidad de registrarte.',
  },
  {
    icon: FolderSearch,
    title: 'Elige según tu objetivo',
    text: 'Ubica la carpeta que mejor encaja con lo que quieres aprender, vender, resolver o construir.',
  },
  {
    icon: KeyRound,
    title: 'Prueba o desbloquea',
    text: 'Usa tu prueba gratuita o activa una carpeta. Cada permiso queda asociado de forma segura a tu cuenta.',
  },
  {
    icon: UserRoundCheck,
    title: 'Consulta desde tu cuenta',
    text: 'Tus contactos completos aparecen en Mis contactos cuando el acceso queda verificado y activo.',
  },
];

export default function HowItWorks() {
  return (
    <section id="como-funciona" className="section-pad section-band">
      <div className="container-shell">
        <SectionHeading
          eyebrow="Cómo funciona"
          align="center"
          title="Un camino claro, sin pasos escondidos"
          description="Primero entiendes qué existe. Después eliges cuánto avanzar."
        />
        <div className="relative mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="absolute left-[12%] right-[12%] top-8 hidden h-px bg-gradient-to-r from-transparent via-brand-400/25 to-transparent xl:block" />
          {steps.map((step, index) => (
            <article key={step.title} className="professional-card relative p-6">
              <div className="flex items-center justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-lg border border-brand-400/20 bg-brand-400/[0.08] text-brand-400">
                  <step.icon className="h-5 w-5" />
                </span>
                <span className="font-mono text-sm font-bold text-slate-600">0{index + 1}</span>
              </div>
              <h3 className="mt-6 text-lg font-bold text-white">{step.title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-400">{step.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
