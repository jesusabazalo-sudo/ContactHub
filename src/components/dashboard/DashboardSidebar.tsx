import { ArrowRight, Folder, LayoutGrid, Settings, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatMemberSince } from '../../lib/format';
import { getAvatarColor, getInitials } from '../../lib/avatar';
import type { DashboardSection } from './dashboardSections';

type DashboardSidebarProps = {
  email: string | null;
  displayName: string | null;
  memberSince: string | null;
  activeSection: DashboardSection;
  onSectionChange: (section: DashboardSection) => void;
};

const NAV_ITEMS: Array<{ id: DashboardSection; label: string; icon: typeof Folder }> = [
  { id: 'folders', label: 'Mis carpetas', icon: Folder },
  { id: 'recent', label: 'Contactos recientes', icon: LayoutGrid },
  { id: 'stats', label: 'Mis estadísticas', icon: TrendingUp },
  { id: 'settings', label: 'Configuración', icon: Settings },
];

export default function DashboardSidebar({ email, displayName, memberSince, activeSection, onSectionChange }: DashboardSidebarProps) {
  const initials = getInitials(email, displayName);
  const avatarColor = getAvatarColor(email ?? displayName ?? 'contacthub');

  return (
    <aside className="hidden w-[280px] shrink-0 flex-col border-r border-border bg-surface lg:flex">
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center gap-3">
          <span
            className="flex h-12 w-12 flex-none items-center justify-center rounded-full text-sm font-bold text-white"
            style={{ backgroundColor: avatarColor }}
            aria-hidden="true"
          >
            {initials}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-content">{displayName || email || 'Tu cuenta'}</p>
            <p className="mt-0.5 text-xs text-content-muted">{formatMemberSince(memberSince)}</p>
          </div>
        </div>

        <div className="mt-6 border-t border-border pt-6">
          <nav className="grid gap-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSectionChange(item.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`focus-ring flex min-h-11 items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-semibold transition ${
                    isActive ? 'bg-brand/10 text-brand-text' : 'text-content-secondary hover:bg-muted hover:text-content'
                  }`}
                >
                  <Icon className="h-4 w-4 flex-none" />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="mt-auto pt-6">
          <Link
            to="/catalogo"
            className="focus-ring flex items-center justify-center gap-2 rounded-full border border-border bg-muted px-4 py-3 text-sm font-bold text-content transition hover:border-brand/40"
          >
            Explorar más carpetas
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </aside>
  );
}
