import { Compass, FolderKanban, LockKeyhole, MessageCircle } from 'lucide-react';
import SectionHeading from '../ui/SectionHeading';

const benefits = [
  {
    icon: Compass,
    title: 'Empieza por tu meta',
    text: 'No todos buscan un contacto. Algunos buscan aprender, vender, trabajar, resolver un problema o abrir una oportunidad. ContactHub te ayuda a ordenar esa búsqueda.',
  },
  {
    icon: FolderKanban,
    title: 'Todo está organizado',
    text: 'Explora categorías claras, descripciones útiles y contactos protegidos. Ves qué existe antes de decidir qué desbloquear.',
  },
  {
    icon: LockKeyhole,
    title: 'Privacidad primero',
    text: 'Los usuarios gratis pueden explorar sin ver números reales. Los teléfonos completos solo aparecen con acceso, prueba o recompensa aprobada.',
  },
  {
    icon: MessageCircle,
    title: 'Orientación cercana',
    text: 'Si no sabes por dónde empezar, el chat te guía por metas: aprender, vender, conseguir proveedores, encontrar servicios o hacer crecer tu negocio.',
  },
];

export default function Benefits() {
  return (
    <section className="section-pad bg-ink-950">
      <div className="container-shell">
        <SectionHeading
          title="Contactos con propósito, no listas sueltas"
          description="Explora lo que necesitas, desbloquea lo que te sirve y avanza con más claridad."
        />
        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {benefits.map((benefit) => (
            <article key={benefit.title} className="card-hover rounded-lg border border-line bg-panel p-5">
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
