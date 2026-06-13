import { Link } from 'react-router-dom';
import { APP_CONFIG } from '../../config/app';

const exploreLinks = [
  { label: 'Catalogo', to: '/catalogo' },
  { label: 'Como funciona', to: '/#como-funciona' },
  { label: 'Guia rapida', to: '/guia' },
  { label: 'Precios', to: '/precios' },
  { label: 'Publica tu servicio', to: '/publica-tu-servicio' },
];

const trustLinks = [
  { label: 'Preguntas frecuentes', to: '/faq' },
  { label: 'Privacidad', to: '/legal#privacidad' },
  { label: 'Uso de datos', to: '/legal#uso-de-datos' },
  { label: 'Terminos y legal', to: '/legal' },
];

function openSupportChat() {
  window.dispatchEvent(new CustomEvent('contacthub:open-chat', { detail: { message: 'Hola, quiero hacer una consulta antes de usar ContactHub.' } }));
}

export default function Footer() {
  return (
    <footer className="border-t border-line bg-ink-950">
      <div className="container-shell grid gap-10 py-12 md:grid-cols-[1.2fr_0.7fr_0.7fr_0.8fr]">
        <div>
          <div className="font-display text-xl font-bold text-white">{APP_CONFIG.name}</div>
          <p className="mt-3 max-w-md text-sm leading-6 text-gray-400">
            Plataforma para explorar contactos y oportunidades organizadas por categorias. Los datos privados se protegen hasta que tengas acceso activo.
          </p>
          <p className="mt-4 max-w-md text-xs leading-5 text-gray-500">
            Usamos tu correo solo para gestionar tu cuenta, accesos, comprobantes y soporte. No vendemos tu informacion ni publicamos tu correo.
          </p>
        </div>

        <div>
          <p className="text-sm font-semibold text-white">Explorar</p>
          <div className="mt-4 grid gap-3 text-sm text-gray-400">
            {exploreLinks.map((link) => (
              <Link key={link.to} to={link.to} className="transition hover:text-white">
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold text-white">Confianza</p>
          <div className="mt-4 grid gap-3 text-sm text-gray-400">
            {trustLinks.map((link) => (
              <Link key={link.to} to={link.to} className="transition hover:text-white">
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold text-white">Soporte</p>
          <p className="mt-4 text-sm leading-6 text-gray-400">
            Si tienes dudas, escribe primero por el chat de ContactHub. Te orientamos antes de registrarte, pagar o subir un comprobante.
          </p>
          <button
            type="button"
            onClick={openSupportChat}
            className="focus-ring mt-4 rounded-full border border-brand-400/30 bg-brand-400/10 px-4 py-2 text-xs font-bold text-brand-100 transition hover:bg-brand-400 hover:text-ink-950"
          >
            Abrir soporte
          </button>
        </div>
      </div>
      <div className="border-t border-line py-5">
        <div className="container-shell text-sm text-gray-500">© 2025 ContactHub · Hecho en Peru</div>
      </div>
    </footer>
  );
}
