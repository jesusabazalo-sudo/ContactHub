import { Link } from 'react-router-dom';
import { APP_CONFIG } from '../../config/app';

const footerLinks = [
  { label: 'Catálogo', to: '/catalogo' },
  { label: 'Guía rápida', to: '/guia' },
  { label: 'Precios', to: '/precios' },
  { label: 'FAQ', to: '/faq' },
  { label: 'Legal', to: '/legal' },
  { label: 'Privacidad', to: '/legal#privacidad' },
  { label: 'Uso de datos', to: '/legal#uso-de-datos' },
];

export default function Footer() {
  return (
    <footer className="border-t border-line bg-ink-950">
      <div className="container-shell grid gap-10 py-12 md:grid-cols-[1.2fr_0.8fr_0.8fr]">
        <div>
          <div className="font-display text-xl font-bold text-white">{APP_CONFIG.name}</div>
          <p className="mt-3 max-w-md text-sm leading-6 text-gray-400">Directorio digital privado de contactos y oportunidades.</p>
          <p className="mt-5 text-xs leading-5 text-gray-500">Para soporte, usa la burbuja de chat de ContactHub.</p>
          <p className="mt-3 max-w-md text-xs leading-5 text-gray-500">
            Usamos tu correo solo para gestionar tu cuenta, accesos, comprobantes y soporte. No vendemos tu información.
          </p>
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
        <div className="container-shell text-sm text-gray-500">© 2025 ContactHub · Hecho en Perú 🇵🇪</div>
      </div>
    </footer>
  );
}
