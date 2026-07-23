import { LogOut, Menu, ShieldCheck, UserRound } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '../../features/auth/AuthProvider';
import ThemeToggle from '../ui/ThemeToggle';
import MobileMenu from './MobileMenu';

const links = [
  { label: 'Inicio', to: '/' },
  { label: 'Catálogo', to: '/catalogo', prefetch: () => import('../../pages/CatalogPage') },
  { label: 'Cómo funciona', to: '/#como-funciona' },
  { label: 'Precios', to: '/precios', prefetch: () => import('../../pages/PricingPage') },
  { label: 'Publicar', to: '/publica-tu-servicio' },
  { label: 'Ayuda', to: '/faq' },
];

function HubLogoMark() {
  return (
    <span
      className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-brand/25 bg-brand/10"
      aria-hidden="true"
    >
      <svg viewBox="0 0 36 36" className="h-7 w-7">
        <path
          d="M18 18 9 11M18 18l10-5M18 18l4 11"
          fill="none"
          stroke="rgb(var(--brand))"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="18" cy="18" r="4.4" fill="rgb(var(--brand))" />
        <circle cx="9" cy="11" r="3.2" fill="rgb(var(--brand-hover))" />
        <circle cx="28" cy="13" r="3.2" fill="rgb(var(--brand-hover))" />
        <circle cx="22" cy="29" r="3.2" fill="rgb(var(--brand-hover))" />
        <circle cx="18" cy="18" r="1.35" fill="rgb(var(--surface))" />
      </svg>
    </span>
  );
}

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCompact, setIsCompact] = useState(false);
  const { isAdmin, session, signOut } = useAuth();
  const mobileLinks = session
    ? [...links, { label: 'Mis contactos', to: '/mis-contactos' }, ...(isAdmin ? [{ label: 'Panel Admin', to: '/admin' }] : [])]
    : links;

  useEffect(() => {
    function handleScroll() {
      setIsCompact(window.scrollY > 50);
    }
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  async function handleSignOut() {
    try {
      await signOut();
      toast.success('Sesión cerrada.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo cerrar sesión.';
      toast.error(message);
    }
  }

  return (
    <>
      <header
        className={`sticky top-0 z-40 border-b border-border bg-canvas/80 backdrop-blur-xl transition-all ${
          isCompact ? 'navbar-compact' : ''
        }`}
      >
        <div className="container-shell flex h-16 items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-3">
            <HubLogoMark />
            <span>
              <span className="block font-display text-base font-bold leading-none text-content">ContactHub</span>
              <span className="mt-1 hidden text-[10px] font-medium uppercase tracking-[0.12em] text-content-muted lg:block">
                Contactos con propósito
              </span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                onMouseEnter={() => void link.prefetch?.()}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-2 text-sm font-medium transition duration-200 ${
                    isActive ? 'bg-muted text-content' : 'text-content-secondary hover:bg-muted hover:text-content'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            <ThemeToggle />
            {isAdmin ? (
              <Link
                to="/admin"
                className="focus-ring inline-flex h-10 w-10 items-center justify-center rounded-full border border-brand/30 bg-brand/10 text-brand-text transition hover:bg-brand hover:text-brand-contrast"
                aria-label="Panel Admin"
              >
                <ShieldCheck className="h-4 w-4" />
              </Link>
            ) : null}
            {session ? (
              <>
                <Link
                  to="/mis-contactos"
                  className="focus-ring inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface text-content-secondary transition hover:border-brand/40 hover:text-content"
                  aria-label="Mis contactos"
                >
                  <UserRound className="h-4 w-4" />
                </Link>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="focus-ring inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface text-content-secondary transition hover:border-brand/40 hover:text-content"
                  aria-label="Cerrar sesión"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </>
            ) : (
              <Link
                to="/auth"
                className="focus-ring inline-flex h-10 items-center justify-center rounded-lg border border-border bg-surface px-4 text-sm font-semibold text-content transition hover:border-brand/40"
                aria-label="Entrar a mi cuenta"
              >
                Entrar
              </Link>
            )}
            <Link
              to="/catalogo"
              className="btn-primary-glow focus-ring inline-flex h-10 items-center justify-center rounded-lg bg-brand px-5 text-sm font-semibold text-brand-contrast"
            >
              Explorar catálogo
            </Link>
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <ThemeToggle />
            <button
              type="button"
              onClick={() => setIsMenuOpen(true)}
              className="focus-ring rounded-full border border-border bg-surface p-2 text-content"
              aria-label="Abrir menú"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>
      <MobileMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} links={mobileLinks} />
    </>
  );
}
