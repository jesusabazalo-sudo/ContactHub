import { X } from 'lucide-react';
import { NavLink } from 'react-router-dom';

type MobileMenuProps = {
  isOpen: boolean;
  onClose: () => void;
  links: Array<{ label: string; to: string }>;
};

export default function MobileMenu({ isOpen, onClose, links }: MobileMenuProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-canvas/95 px-4 py-4 backdrop-blur-xl md:hidden">
      <div className="flex items-center justify-between">
        <NavLink to="/" onClick={onClose} className="font-display text-xl font-bold text-content">
          ContactHub
        </NavLink>
        <button
          type="button"
          onClick={onClose}
          className="focus-ring rounded-full border border-border bg-surface p-2 text-content"
          aria-label="Cerrar menú"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="mt-10 grid gap-3">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            onClick={onClose}
            className={({ isActive }) =>
              `rounded-xl border px-4 py-3 text-base font-medium transition ${
                isActive
                  ? 'border-brand/40 bg-brand/10 text-brand-text'
                  : 'border-border bg-surface text-content-secondary'
              }`
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
