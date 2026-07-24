import { Coins, Folder, LayoutGrid, Settings, TrendingUp } from 'lucide-react';
import type { DashboardSection } from './dashboardSections';

type DashboardBottomTabsProps = {
  activeSection: DashboardSection;
  onSectionChange: (section: DashboardSection) => void;
};

const TABS: Array<{ id: DashboardSection; label: string; icon: typeof Folder }> = [
  { id: 'folders', label: 'Carpetas', icon: Folder },
  { id: 'recent', label: 'Recientes', icon: LayoutGrid },
  { id: 'stats', label: 'Stats', icon: TrendingUp },
  { id: 'tokens', label: 'Tokens', icon: Coins },
  { id: 'settings', label: 'Config', icon: Settings },
];

export default function DashboardBottomTabs({ activeSection, onSectionChange }: DashboardBottomTabsProps) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-border bg-surface/95 backdrop-blur-lg lg:hidden">
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeSection === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onSectionChange(tab.id)}
            aria-current={isActive ? 'page' : undefined}
            className={`focus-ring flex min-h-[56px] flex-col items-center justify-center gap-1 py-2 text-[11px] font-semibold transition ${
              isActive ? 'text-brand-text' : 'text-content-muted'
            }`}
          >
            <Icon className="h-5 w-5" />
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}
