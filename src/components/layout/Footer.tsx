import { Link } from 'react-router-dom';
import { APP_CONFIG } from '../../config/app';

const exploreLinks = [
  { label: 'Catálogo', to: '/catalogo' },
  { label: 'Cómo funciona', to: '/#como-funciona' },
  { label: 'Guía rápida', to: '/guia' },
  { label: 'Precios', to: '/precios' },
  { label: 'Publica tu servicio', to: '/publica-tu-servicio' },
];

const trustLinks = [
  { label: 'Preguntas frecuentes', to: '/faq' },
  { label: 'Soporte', to: '/soporte' },
];

function openSupportChat() {
  window.dispatchEvent(new CustomEvent('contacthub:open-chat', { detail: { message: 'Hola, quiero hacer una consulta antes de usar ContactHub.' } }));
}

const year = new Date().getFullYear();

export default function Footer() {
  return (
    <footer className="border-t border-border bg-canvas-subtle">
      <div className="container-shell grid gap-10 py-16 md:grid-cols-[1.3fr_0.7fr_0.7fr_0.8fr]">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-brand/25 bg-brand/10">
              <svg viewBox="0 0 36 36" className="h-6 w-6" aria-hidden="true">
                <path d="M18 18 9 11M18 18l10-5M18 18l4 11" fill="none" stroke="rgb(var(--brand))" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="18" cy="18" r="4.4" fill="rgb(var(--brand))" />
                <circle cx="9" cy="11" r="3.2" fill="rgb(var(--brand-hover))" />
                <circle cx="28" cy="13" r="3.2" fill="rgb(var(--brand-hover))" />
                <circle cx="22" cy="29" r="3.2" fill="rgb(var(--brand-hover))" />
              </svg>
            </span>
            <span className="font-display text-2xl font-bold text-content">{APP_CONFIG.name}</span>
          </div>
          <p className="mt-4 max-w-md text-sm leading-6 text-content-secondary">
            Contactos y oportunidades organizadas para ayudarte a aprender, vender, trabajar, encontrar servicios o avanzar con una meta concreta.
          </p>
          <p className="mt-4 max-w-md text-xs leading-5 text-content-muted">
            Usamos tu correo solo para gestionar tu cuenta, accesos, comprobantes y soporte. No vendemos tu información ni publicamos tu correo.
          </p>
        </div>

        <div>
          <p className="text-sm font-semibold text-content">Explorar</p>
          <div className="mt-4 grid gap-3 text-sm text-content-secondary">
            {exploreLinks.map((link) => (
              <Link key={link.to} to={link.to} className="w-fit transition hover:text-content">
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold text-content">Confianza</p>
          <div className="mt-4 grid gap-3 text-sm text-content-secondary">
            {trustLinks.map((link) => (
              <Link key={link.to} to={link.to} className="w-fit transition hover:text-content">
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold text-content">Soporte</p>
          <p className="mt-4 text-sm leading-6 text-content-secondary">
            Si tienes dudas, escribe primero por el chat de ContactHub. Te orientamos antes de registrarte, pagar o subir un comprobante.
          </p>
          <button
            type="button"
            onClick={openSupportChat}
            className="focus-ring mt-4 rounded-lg border border-brand/30 bg-brand/10 px-4 py-2 text-xs font-semibold text-brand-text transition hover:bg-brand/15"
          >
            Abrir soporte
          </button>
        </div>
      </div>
      <div className="border-t border-border py-5">
        <div className="container-shell text-xs text-content-muted">
          <span>© {year} ContactHub · Hecho en Perú</span>
        </div>
      </div>
    </footer>
  );
}
