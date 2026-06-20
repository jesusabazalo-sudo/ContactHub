import { CheckCircle2, ClipboardCheck, MessageCircle, RefreshCw, Tags, UserRoundCheck } from 'lucide-react';
import SectionHeading from '../ui/SectionHeading';

const items = [
  { icon: UserRoundCheck, title: 'Contactos completos', text: 'Acceso a los teléfonos de la categoría que desbloqueaste.' },
  { icon: MessageCircle, title: 'Consulta por WhatsApp', text: 'Botón directo para abrir una conversación con cada contacto.' },
  { icon: ClipboardCheck, title: 'Mensaje prellenado', text: 'Un texto profesional listo para revisar antes de enviarlo.' },
  { icon: Tags, title: 'Información organizada', text: 'Etiquetas y descripciones para entender mejor cada opción.' },
  { icon: CheckCircle2, title: 'Acceso guardado', text: 'Tus permisos quedan asociados a tu cuenta de ContactHub.' },
  { icon: RefreshCw, title: 'Actualizaciones', text: 'La carpeta puede incorporar nuevos contactos según disponibilidad.' },
];

export default function WhatYouReceive() {
  return (
    <section className="section-pad bg-canvas">
      <div className="container-shell">
        <div className="grid gap-10 lg:grid-cols-[0.75fr_1.25fr] lg:items-start">
          <div>
            <SectionHeading
              eyebrow="Tu acceso"
              title="¿Qué recibes al desbloquear una carpeta?"
              description="Una vista privada y ordenada para consultar contactos desde tu propia cuenta."
            />
            <div className="mt-6 rounded-lg border border-border bg-muted p-5 text-sm leading-6 text-content-secondary">
              <strong className="text-content">Alcance responsable.</strong> ContactHub organiza información de contacto. No garantiza respuestas, ventas ni resultados específicos; te ayuda a ahorrar tiempo encontrando opciones organizadas.
            </div>
          </div>

          <div className="grid gap-px overflow-hidden rounded-lg border border-border bg-line sm:grid-cols-2">
            {items.map((item) => (
              <article key={item.title} className="bg-canvas-subtle p-5 transition hover:bg-surface">
                <item.icon className="h-5 w-5 text-brand-text" />
                <h3 className="mt-4 text-sm font-bold text-content">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-content-secondary">{item.text}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
