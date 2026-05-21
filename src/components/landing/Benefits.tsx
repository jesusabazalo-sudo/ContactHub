import { Clock3, FolderKanban, LockKeyhole, MessageCircle } from 'lucide-react';
import SectionHeading from '../ui/SectionHeading';

const benefits = [
  {
    icon: Clock3,
    title: 'El tiempo que no recuperas',
    text: 'El tiempo que no recuperas buscando en grupos de WhatsApp podría estar generándote resultados. Aquí está lo que encontrarías después de semanas — sin las semanas.',
  },
  {
    icon: FolderKanban,
    title: 'Sin alguien en el medio',
    text: 'Sin alguien en el medio. Sin que te ignoren. Sin esperar. El contacto exacto, directo, listo para cuando tú quieras escribirle.',
  },
  {
    icon: LockKeyhole,
    title: 'Tu acceso es tuyo',
    text: 'Tu acceso es tuyo. Nadie más lo ve, nadie más lo usa. Lo que compras, es solo tuyo.',
  },
  {
    icon: MessageCircle,
    title: 'Alguien real del otro lado',
    text: 'Si tienes una duda, hay alguien real del otro lado. No un bot, no un FAQ — una persona que construyó esto y conoce cada contacto.',
  },
];

export default function Benefits() {
  return (
    <section className="section-pad bg-ink-950">
      <div className="container-shell">
        <SectionHeading title="Lo que descubres cuando dejas de buscar solo" />
        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {benefits.map((benefit) => (
            <article key={benefit.title} className="rounded-lg border border-line bg-panel p-5 transition duration-200 hover:-translate-y-1 hover:border-brand-400/30">
              <benefit.icon className="h-6 w-6 text-brand-400" />
              <h3 className="mt-5 text-base font-bold text-white">{benefit.title}</h3>
              <p className="mt-3 text-sm leading-6 text-gray-400">{benefit.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
