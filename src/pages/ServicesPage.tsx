import { MessageCircle } from 'lucide-react';
import SectionHeading from '../components/ui/SectionHeading';

const services = [
  {
    name: 'Landing pages para negocios',
    text: 'Una solución digital enfocada en vender, organizar o automatizar mejor lo que ya estás intentando mover.',
  },
  {
    name: 'Desarrollo Web',
    text: 'Páginas web claras, rápidas y preparadas para que un negocio pueda mostrar lo que ofrece sin vueltas.',
    badge: '🚀 Próximamente',
    message: 'Hola, estoy interesado en una página web para mi negocio. Vi ese servicio en ContactHub.',
  },
  {
    name: 'Impulsa tu negocio',
    text: 'Promoción y exposición para proyectos que necesitan llegar a más personas correctas.',
    badge: '🚀 Próximamente',
    message: 'Hola, quiero impulsar mi negocio o página web. Vi esa opción en ContactHub.',
  },
  {
    name: 'Automatizaciones con IA',
    text: 'Flujos simples para responder, ordenar información y ahorrar tiempo operativo.',
  },
  {
    name: 'Directorios digitales',
    text: 'Sistemas organizados por categorías, accesos y contenido útil para comunidades o negocios.',
  },
  {
    name: 'Sistemas simples para emprendedores',
    text: 'Herramientas concretas para vender, gestionar o validar ideas sin construir de más.',
  },
];

function openChat(message: string) {
  window.dispatchEvent(new CustomEvent('contacthub:open-chat', { detail: { message } }));
}

export default function ServicesPage() {
  return (
    <section className="section-pad bg-canvas">
      <div className="container-shell">
        <SectionHeading
          eyebrow="Servicios digitales"
          title="Además de ContactHub, también puedo ayudarte a convertir tus ideas en una web real."
          description="Servicios pensados para emprendedores que necesitan algo útil, claro y publicable sin convertir cada decisión en una obra eterna."
        />
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {services.map((service) => (
            <article
              key={service.name}
              role={service.message ? 'button' : undefined}
              tabIndex={service.message ? 0 : undefined}
              onClick={() => service.message && openChat(service.message)}
              onKeyDown={(event) => {
                if (service.message && (event.key === 'Enter' || event.key === ' ')) {
                  event.preventDefault();
                  openChat(service.message);
                }
              }}
              className={`card-hover relative rounded-lg border border-border bg-surface p-6 ${service.message ? 'cursor-pointer transition hover:border-brand-400/35' : ''}`}
            >
              {service.badge ? <span className="absolute right-4 top-4 rounded-md bg-amber-700 px-2.5 py-1 text-xs font-bold text-content">{service.badge}</span> : null}
              <h2 className="pr-28 text-lg font-bold text-content">{service.name}</h2>
              <p className="mt-3 text-sm leading-6 text-content-secondary">{service.text}</p>
            </article>
          ))}
        </div>
        <button
          type="button"
          onClick={() => openChat('Hola, quiero hablar sobre un proyecto digital para mi negocio.')}
          className="focus-ring btn-primary-glow mt-8 inline-flex items-center gap-2 rounded-full bg-brand-400 px-6 py-3 text-sm font-bold text-ink-950 transition hover:bg-white"
        >
          <MessageCircle className="h-4 w-4" />
          Abrir chat sobre mi proyecto
        </button>
      </div>
    </section>
  );
}
