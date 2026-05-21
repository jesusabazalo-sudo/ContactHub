import { MessageCircle } from 'lucide-react';
import SectionHeading from '../components/ui/SectionHeading';
import { createWhatsAppUrl, servicesWhatsAppMessage } from '../lib/whatsapp';

const services = [
  {
    name: 'Landing pages para negocios',
    text: 'Una solución digital enfocada en vender, organizar o automatizar mejor lo que ya estás intentando mover.',
  },
  {
    name: 'Desarrollo Web',
    text: 'Páginas web claras, rápidas y preparadas para que un negocio pueda mostrar lo que ofrece sin vueltas.',
    badge: '🚀 Próximamente',
    url: 'https://wa.me/51963187899?text=Hola%2C+estoy+interesado+en+que+me+hagas+una+p%C3%A1gina+web+para+mi+negocio.+Vi+que+ofreces+ese+servicio+en+ContactHub.',
  },
  {
    name: 'Impulsa tu negocio',
    text: 'Promoción y exposición para proyectos que necesitan llegar a más personas correctas.',
    badge: '🚀 Próximamente',
    url: 'https://wa.me/51963187899?text=Hola%2C+quiero+impulsar+mi+negocio+o+p%C3%A1gina+web.+Vi+la+opci%C3%B3n+de+promoci%C3%B3n+en+ContactHub.',
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

export default function ServicesPage() {
  return (
    <section className="section-pad bg-ink-950">
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
              role={service.url ? 'button' : undefined}
              tabIndex={service.url ? 0 : undefined}
              onClick={() => service.url && window.open(service.url, '_blank', 'noopener,noreferrer')}
              onKeyDown={(event) => {
                if (service.url && (event.key === 'Enter' || event.key === ' ')) {
                  event.preventDefault();
                  window.open(service.url, '_blank', 'noopener,noreferrer');
                }
              }}
              className={`relative rounded-lg border border-line bg-panel p-6 ${service.url ? 'cursor-pointer transition hover:border-brand-400/35' : ''}`}
            >
              {service.badge ? (
                <span className="absolute right-4 top-4 rounded-md bg-amber-700 px-2.5 py-1 text-xs font-bold text-white">{service.badge}</span>
              ) : null}
              <h2 className="pr-28 text-lg font-bold text-white">{service.name}</h2>
              <p className="mt-3 text-sm leading-6 text-gray-400">{service.text}</p>
            </article>
          ))}
        </div>
        <a
          href={createWhatsAppUrl(servicesWhatsAppMessage())}
          target="_blank"
          rel="noreferrer"
          className="focus-ring mt-8 inline-flex items-center gap-2 rounded-full bg-brand-400 px-6 py-3 text-sm font-bold text-ink-950 transition hover:bg-white"
        >
          <MessageCircle className="h-4 w-4" />
          Quiero hablar de mi proyecto
        </a>
      </div>
    </section>
  );
}
