import { LogOut, Menu, ShieldCheck, UserRound } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '../../features/auth/AuthProvider';
import MobileMenu from './MobileMenu';

const links = [
  { label: 'Índice', to: '/' },
  { label: 'Promos', to: '/promos' },
  { label: 'Catálogo', to: '/catalogo' },
  { label: 'Precios', to: '/precios' },
  { label: 'Preguntas', to: '/faq' },
];

function HubLogoMark() {
  return (
    <span className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-brand-400/30 bg-brand-400/10 shadow-[0_0_22px_rgba(29,180,122,0.18)]" aria-hidden="true">
      <svg viewBox="0 0 36 36" className="h-7 w-7">
        <path d="M18 18 9 11M18 18l10-5M18 18l4 11" fill="none" stroke="#1DB47A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="18" cy="18" r="4.4" fill="#1DB47A" />
        <circle cx="9" cy="11" r="3.2" fill="#09E193" />
        <circle cx="28" cy="13" r="3.2" fill="#09E193" />
        <circle cx="22" cy="29" r="3.2" fill="#09E193" />
        <circle cx="18" cy="18" r="1.35" fill="#071111" />
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
      <header className={`sticky top-0 z-40 border-b border-line bg-ink-950/82 backdrop-blur-xl transition-all ${isCompact ? 'navbar-compact' : ''}`}>
        <div className="container-shell flex h-16 items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-3">
            <HubLogoMark />
            <span className="font-display text-lg font-bold text-white">ContactHub</span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `rounded-full px-4 py-2 text-sm font-medium transition duration-200 ${
                    isActive ? 'bg-white/[0.08] text-white' : 'text-gray-300 hover:bg-white/[0.06] hover:text-white'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            {isAdmin ? (
              <Link to="/admin" className="focus-ring inline-flex h-10 w-10 items-center justify-center rounded-full border border-brand-400/30 bg-brand-400/10 text-brand-400 transition hover:bg-brand-400 hover:text-ink-950" aria-label="Panel Admin">
                <ShieldCheck className="h-4 w-4" />
              </Link>
            ) : null}
            {session ? (
              <>
                <Link to="/mis-contactos" className="focus-ring inline-flex h-10 w-10 items-center justify-center rounded-full border border-line bg-white/5 text-white transition hover:border-brand-400/30 hover:bg-brand-400/10" aria-label="Mis contactos">
                  <UserRound className="h-4 w-4" />
                </Link>
                <button type="button" onClick={handleSignOut} className="focus-ring inline-flex h-10 w-10 items-center justify-center rounded-full border border-line bg-white/5 text-white transition hover:border-brand-400/30 hover:bg-brand-400/10" aria-label="Cerrar sesión">
                  <LogOut className="h-4 w-4" />
                </button>
              </>
            ) : (
              <Link to="/auth" className="focus-ring inline-flex h-10 w-10 items-center justify-center rounded-full border border-line bg-white/5 text-white transition hover:border-brand-400/30 hover:bg-brand-400/10" aria-label="Entrar a mi cuenta">
                <UserRound className="h-4 w-4" />
              </Link>
            )}
            <Link to="/catalogo" className="focus-ring inline-flex items-center justify-center rounded-full bg-brand-400 px-5 py-2.5 text-sm font-bold text-ink-950 transition duration-200 hover:bg-white">
              Déjame ver qué hay
            </Link>
          </div>

          <button type="button" onClick={() => setIsMenuOpen(true)} className="focus-ring rounded-full border border-line bg-white/5 p-2 text-white md:hidden" aria-label="Abrir menú">
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </header>
      <MobileMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} links={mobileLinks} />
    </>
  );
}
