import { Link } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import { APP_CONFIG } from '../../config/app';
import { createWhatsAppUrl } from '../../lib/whatsapp';

const footerLinks = [
  { label: 'Catálogo', to: '/catalogo' },
  { label: 'Precios', to: '/precios' },
  { label: 'FAQ', to: '/faq' },
  { label: 'Legal', to: '/legal' },
];

export default function Footer() {
  return (
    <footer className="border-t border-line bg-ink-950">
      <div className="container-shell grid gap-10 py-12 md:grid-cols-[1.2fr_0.8fr_0.8fr]">
        <div>
          <div className="font-display text-xl font-bold text-white">{APP_CONFIG.name}</div>
          <p className="mt-3 max-w-md text-sm leading-6 text-gray-400">Directorio digital privado de contactos y oportunidades.</p>
          <a
            href={createWhatsAppUrl('Hola, tengo una pregunta real sobre ContactHub.')}
            target="_blank"
            rel="noreferrer"
            className="focus-ring mt-5 inline-flex items-center gap-2 rounded-full border border-brand-400/25 bg-brand-400/10 px-4 py-2 text-sm font-semibold text-brand-400 transition hover:bg-brand-400 hover:text-ink-950"
          >
            <MessageCircle className="h-4 w-4" />
            WhatsApp
          </a>
        </div>

        <div>
          <p className="text-sm font-semibold text-white">Explorar</p>
          <div className="mt-4 grid gap-3 text-sm text-gray-400">
            {footerLinks.map((link) => (
              <Link key={link.to} to={link.to} className="transition hover:text-white">
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold text-white">Fase actual</p>
          <p className="mt-4 text-sm leading-6 text-gray-400">
            Base pública lista para conectar Supabase, activar accesos manuales y seguir con las fases privadas del producto.
          </p>
        </div>
      </div>
      <div className="border-t border-line py-5">
        <div className="container-shell text-sm text-gray-500">© 2026 ContactHub</div>
      </div>
    </footer>
  );
}
