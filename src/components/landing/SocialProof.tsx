import { Star } from 'lucide-react';
import { APP_CONFIG } from '../../config/app';
import AnimatedNumber from '../ui/AnimatedNumber';
import SectionHeading from '../ui/SectionHeading';

type Testimonial = {
  name: string;
  city: string;
  initials: string;
  quote: string;
  accent: 'brand' | 'violet' | 'cyan';
};

const testimonials: Testimonial[] = [
  {
    name: 'Rosa Medina',
    city: 'Lima',
    initials: 'RM',
    quote: 'Encontré 5 proveedores de IA en un día. Antes buscaba semanas en grupos de WhatsApp.',
    accent: 'brand',
  },
  {
    name: 'Carlos Huamán',
    city: 'Arequipa',
    initials: 'CH',
    quote: 'La carpeta de negocios me ahorró horas de búsqueda. Todo ya venía organizado por categoría.',
    accent: 'violet',
  },
  {
    name: 'Jimena Torres',
    city: 'Trujillo',
    initials: 'JT',
    quote: 'Pagué por Yape, subí mi comprobante y en menos de un día ya tenía acceso activo.',
    accent: 'cyan',
  },
];

const CONTACTS_STAT_TARGET = Number(APP_CONFIG.contactsClaim.replace(/\D/g, '')) || 0;
const CATEGORIES_STAT_TARGET = Number(APP_CONFIG.categoriesClaim.replace(/\D/g, '')) || 0;

const animatedStats = [
  { end: CONTACTS_STAT_TARGET, suffix: '+', label: 'contactos curados' },
  { end: CATEGORIES_STAT_TARGET, suffix: '', label: 'categorías' },
  { end: 100, prefix: '+', suffix: '', label: 'usuarios activos' },
];
const staticStats = [{ value: '<24h', label: 'tiempo de acceso' }];

const accentClasses: Record<Testimonial['accent'], string> = {
  brand: 'bg-brand/15 text-brand-text',
  violet: 'bg-accent-violet/15 text-accent-violet',
  cyan: 'bg-accent-cyan/15 text-accent-cyan',
};

export default function SocialProof() {
  return (
    <section className="section-pad bg-canvas">
      <div className="container-shell">
        <SectionHeading
          align="center"
          eyebrow="Confianza"
          title="Emprendedores que ya lo están usando"
          description="Personas reales resolviendo necesidades reales, sin vueltas."
        />
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {testimonials.map((testimonial) => (
            <article key={testimonial.name} className="professional-card flex flex-col p-5">
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Star key={index} className="h-3.5 w-3.5 fill-warning text-warning" />
                ))}
              </div>
              <p className="mt-3 flex-1 text-sm leading-6 text-content-secondary">“{testimonial.quote}”</p>
              <div className="mt-5 flex items-center gap-3 border-t border-border pt-4">
                <span
                  className={`flex h-10 w-10 flex-none items-center justify-center rounded-full text-xs font-bold ${accentClasses[testimonial.accent]}`}
                  aria-hidden="true"
                >
                  {testimonial.initials}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-content">{testimonial.name}</p>
                  <p className="text-xs text-content-muted">{testimonial.city}, Perú</p>
                </div>
              </div>
            </article>
          ))}
        </div>
        <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {animatedStats.map((stat) => (
            <div key={stat.label} className="rounded-xl border border-border bg-surface p-4 text-center">
              <AnimatedNumber
                value={stat.end}
                prefix={stat.prefix}
                suffix={stat.suffix}
                className="font-display text-2xl font-bold text-brand-text"
              />
              <p className="mt-1 text-xs text-content-muted">{stat.label}</p>
            </div>
          ))}
          {staticStats.map((stat) => (
            <div key={stat.label} className="rounded-xl border border-border bg-surface p-4 text-center">
              <p className="font-display text-2xl font-bold text-brand-text">{stat.value}</p>
              <p className="mt-1 text-xs text-content-muted">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
